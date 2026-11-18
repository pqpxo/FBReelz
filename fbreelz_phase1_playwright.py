## version 3 - Enhanced Edition
"""FBReelz Phase 1 (Playwright) - Enhanced

Improvements in v3:
- Infinite scroll to capture ALL saved items (not just first page)
- Cookie validation and expiration checking
- Better error handling and logging
- Improved link extraction with more specific patterns
- Stale scroll detection to avoid infinite loops
- Better headed/headless handling

Usage:
  # Headless (recommended on servers)
  python fbreelz_phase1_playwright.py --max 200

  # Headed (requires display)
  python fbreelz_phase1_playwright.py --max 50 --headed

  # With verbose logging
  python fbreelz_phase1_playwright.py --max 100 --verbose
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError, Page


# Configuration
DATA_DIR = Path(os.environ.get("FBREELZ_DATA_DIR", "/opt/fbreelz/data"))
OUT_JSON = DATA_DIR / "saved_items.json"
DEBUG_HTML = DATA_DIR / "debug_playwright_saved.html"

SAVED_URLS = [
    "https://www.facebook.com/saved/",
    "https://m.facebook.com/saved/",
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(DATA_DIR / "fbreelz_phase1.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def _load_cookies_netscape(path: Path) -> List[Dict[str, Any]]:
    """Load Netscape cookies.txt format."""
    cookies: List[Dict[str, Any]] = []
    if not path.exists():
        logger.warning(f"Cookies file not found: {path}")
        return cookies

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 7:
            continue
        domain, flag, cookie_path, secure, expires, name, value = parts
        cookies.append(
            {
                "name": name,
                "value": value,
                "domain": domain,
                "path": cookie_path or "/",
                "expires": int(expires) if expires.isdigit() else -1,
                "httpOnly": False,
                "secure": secure.upper() == "TRUE",
                "sameSite": "Lax",
            }
        )
    
    logger.info(f"Loaded {len(cookies)} cookies from {path}")
    return cookies


def _validate_cookies(cookies: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """Validate cookies and check for expiration."""
    issues = []
    current_time = int(time.time())
    
    # Check for essential Facebook cookies
    cookie_names = {c['name'] for c in cookies}
    essential = {'c_user', 'xs'}  # Facebook auth cookies
    missing = essential - cookie_names
    
    if missing:
        issues.append(f"Missing essential cookies: {missing}")
        logger.error(f"Missing essential Facebook cookies: {missing}")
    
    # Check expiration
    expired = []
    for c in cookies:
        exp = c.get('expires', -1)
        if exp > 0 and exp < current_time:
            expired.append(c['name'])
    
    if expired:
        issues.append(f"Expired cookies: {expired}")
        logger.warning(f"Found expired cookies: {expired}")
    
    is_valid = len(issues) == 0
    if is_valid:
        logger.info("Cookie validation passed")
    
    return is_valid, issues


def _extract_saved_links(html: str) -> List[str]:
    """Extract video/reel links with improved pattern matching."""
    # More specific patterns to avoid false positives
    patterns = [
        r'href=\"(https://www\.facebook\.com/reel/\d+[^\"]*?)\"',
        r'href=\"(https://www\.facebook\.com/watch/\?v=\d+[^\"]*?)\"',
        r'href=\"(https://www\.facebook\.com/[^/]+/videos/\d+[^\"]*?)\"',
        r'href=\"(/reel/\d+[^\"]*?)\"',
        r'href=\"(/watch/\?v=\d+[^\"]*?)\"',
    ]
    
    links = set()
    for pattern in patterns:
        matches = re.findall(pattern, html)
        for match in matches:
            # Normalize relative URLs
            if match.startswith('/'):
                match = 'https://www.facebook.com' + match
            
            # Clean tracking parameters
            match = re.sub(r'[?&](fbclid|__cft__|__tn__|ref|refid|__xts__|_rdr)=[^&]*', '', match)
            match = re.sub(r'[?&]+$', '', match)
            
            # Validate it's actually a Facebook URL
            if 'facebook.com' in match and any(p in match for p in ['/reel/', '/watch/', '/videos/']):
                links.add(match)
    
    return sorted(links)


def _scroll_and_extract(page: Page, max_items: int, scroll_pause: float = 2.0) -> List[str]:
    """Scroll page to load more saved items and extract all links."""
    all_links = set()
    last_count = 0
    stale_count = 0
    max_stale = 3  # Stop after 3 scrolls with no new items
    max_scrolls = 50  # Maximum scroll attempts
    
    logger.info(f"Starting infinite scroll (max_items={max_items}, max_scrolls={max_scrolls})")
    
    for scroll_num in range(max_scrolls):
        # Extract links from current page state
        html = page.content()
        links = set(_extract_saved_links(html))
        all_links.update(links)
        
        current_count = len(all_links)
        new_items = current_count - last_count
        
        logger.info(f"Scroll {scroll_num + 1}: Found {current_count} total items (+{new_items} new)")
        
        # Check if we have enough items
        if current_count >= max_items:
            logger.info(f"Reached target of {max_items} items")
            break
        
        # Check if we're still getting new items
        if new_items == 0:
            stale_count += 1
            logger.debug(f"No new items found (stale_count={stale_count}/{max_stale})")
            if stale_count >= max_stale:
                logger.info("No new items after multiple scrolls - stopping")
                break
        else:
            stale_count = 0
        
        last_count = current_count
        
        # Scroll to bottom
        try:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(int(scroll_pause * 1000))
            
            # Additional wait for lazy-loaded content
            try:
                page.wait_for_load_state("networkidle", timeout=5000)
            except PWTimeoutError:
                pass  # Continue even if network isn't idle
                
        except Exception as e:
            logger.warning(f"Scroll error: {e}")
            break
    
    result = sorted(all_links)[:max_items]
    logger.info(f"Extraction complete: {len(result)} items (from {len(all_links)} found)")
    return result


def main(max_items: int, headed: bool, verbose: bool) -> int:
    if verbose:
        logger.setLevel(logging.DEBUG)
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    cookies_path = Path(os.environ.get("FBREELZ_COOKIES", "/opt/fbreelz/secrets/cookies.txt"))
    
    # Load and validate cookies
    cookies = _load_cookies_netscape(cookies_path)
    if not cookies:
        logger.error("No cookies loaded - authentication will likely fail")
        return 1
    
    is_valid, issues = _validate_cookies(cookies)
    if not is_valid:
        logger.warning(f"Cookie validation issues: {issues}")
        logger.warning("Proceeding anyway, but you may need to refresh your cookies")
    
    # Headless by default
    headless = not headed
    
    if headed and not os.environ.get("DISPLAY"):
        logger.warning("--headed requested but DISPLAY not set")
        logger.warning("On headless servers, use default (headless) or run via Xvfb:")
        logger.warning("  xvfb-run -a python fbreelz_phase1_playwright.py --headed --max 30")
    
    logger.info(f"Starting Playwright (headless={headless})")
    
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context(
                user_agent=os.environ.get(
                    "FBREELZ_UA",
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                )
            )
            
            # Add cookies to context
            context.add_cookies(cookies)
            
            page = context.new_page()
            
            last_html: Optional[str] = None
            last_url: Optional[str] = None
            
            # Try each saved URL endpoint
            for url in SAVED_URLS:
                try:
                    logger.info(f"Attempting to load: {url}")
                    last_url = url
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)
                    page.wait_for_timeout(2000)  # Let JavaScript render
                    
                    last_html = page.content()
                    
                    # Check for interstitial/error pages
                    if last_html and "Facebook is not available on this browser" in last_html:
                        logger.warning(f"Interstitial detected on {url} - trying next endpoint")
                        continue
                    
                    if last_html and ("Log in to Facebook" in last_html or "login" in page.url.lower()):
                        logger.error("Not logged in - cookies may be invalid or expired")
                        browser.close()
                        return 2
                    
                    logger.info(f"Successfully loaded: {url}")
                    break
                    
                except PWTimeoutError:
                    logger.warning(f"Timeout loading {url} - trying next endpoint")
                    continue
                except Exception as e:
                    logger.error(f"Error loading {url}: {e}")
                    continue
            
            if not last_html:
                logger.error("Could not load any Saved page endpoint")
                browser.close()
                return 2
            
            # Save debug HTML
            DEBUG_HTML.write_text(last_html, encoding="utf-8")
            logger.info(f"Saved HTML snapshot to: {DEBUG_HTML}")
            
            # Scroll and extract all links
            links = _scroll_and_extract(page, max_items)
            
            if not links:
                logger.error("No video/reel links found")
                logger.error("Possible causes:")
                logger.error("  - Cookies are expired or invalid")
                logger.error("  - Facebook UI has changed")
                logger.error("  - No saved videos in your collection")
                logger.error(f"Check {DEBUG_HTML} for debugging")
                browser.close()
                return 3
            
            logger.info(f"Extracted {len(links)} video links")
            
            # Create Phase-1 JSON compatible with Phase-2
            edges = []
            for u in links:
                edges.append({
                    "node": {
                        "savable": {
                            "__typename": "Video",
                            "savable_permalink": u
                        }
                    }
                })
            
            payload = {
                "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                "detected_format": "graphql_edges",
                "source": "playwright_infinite_scroll",
                "version": "3.0",
                "max_requested": max_items,
                "total_found": len(edges),
                "data": {
                    "viewer": {
                        "saver_info": {
                            "all_saves": {
                                "edges": edges
                            }
                        }
                    }
                }
            }
            
            OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
            logger.info(f"Wrote Phase-1 JSON to: {OUT_JSON}")
            logger.info(f"Total items: {len(edges)} (max requested: {max_items})")
            
            browser.close()
            return 0
            
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            return 4


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="FBReelz Phase 1 via Playwright (Enhanced)")
    ap.add_argument("--max", type=int, default=30, help="Max saved items to capture (default: 30)")
    ap.add_argument("--headed", action="store_true", help="Run with visible browser (requires DISPLAY)")
    ap.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    args = ap.parse_args()
    
    raise SystemExit(main(args.max, args.headed, args.verbose))
