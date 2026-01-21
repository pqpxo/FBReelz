## version 2
"""FBReelz Phase 1 (Playwright)

Purpose
- Fetch Facebook Saved items using a real browser engine to avoid the mbasic "not available on this browser" interstitial.
- Designed for headless servers by default (no GUI required).

Notes
- Requires Playwright + browser binaries:
    python -m pip install playwright
    python -m playwright install chromium
- Requires OS deps (Debian/Ubuntu):
    sudo apt-get update
    sudo apt-get install -y libnspr4 libnss3
  (You can also run: sudo python -m playwright install-deps chromium)

Usage
  # headless (recommended on servers)
  python fbreelz_phase1_playwright_v2.py --max 30

  # headed (requires a display or Xvfb)
  python fbreelz_phase1_playwright_v2.py --max 30 --headed

Outputs
- /opt/fbreelz/data/saved_items.json (Phase-1 JSON compatible with Phase-2)
- /opt/fbreelz/data/debug_playwright_saved.html (HTML snapshot for debugging)
"""

from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError


DATA_DIR = Path(os.environ.get("FBREELZ_DATA_DIR", "/opt/fbreelz/data"))
OUT_JSON = DATA_DIR / "saved_items.json"
DEBUG_HTML = DATA_DIR / "debug_playwright_saved.html"

SAVED_URLS = [
    "https://www.facebook.com/saved/",
    "https://m.facebook.com/saved/",
]


def _load_cookies_netscape(path: Path) -> List[Dict[str, Any]]:
    """Load Netscape cookies.txt (like exported from browser extensions)."""
    cookies: List[Dict[str, Any]] = []
    if not path.exists():
        return cookies

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 7:
            continue
        domain, flag, cookie_path, secure, expires, name, value = parts
        # Playwright expects domain without leading dot is fine; keep as-is.
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
    return cookies


def _extract_saved_links(html: str) -> List[str]:
    # Grab common reel/video patterns
    hrefs = set(re.findall(r'href=\"([^\"]+)\"', html))
    out: List[str] = []
    for h in hrefs:
        # Normalize
        if h.startswith("/"):
            h = "https://www.facebook.com" + h
        if any(p in h for p in ("/reel/", "/watch/?v=", "/videos/")):
            # Strip fbclid params etc.
            h = re.sub(r"([?&])(fbclid|__cft__|__tn__|ref|refid|__xts__|_rdr)=[^&]+", r"\1", h)
            h = re.sub(r"[?&]+$", "", h)
            out.append(h)
    # Stable order
    out = sorted(set(out))
    return out


def main(max_items: int, headed: bool) -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    cookies_path = Path(os.environ.get("FBREELZ_COOKIES", "/opt/fbreelz/secrets/cookies.txt"))
    cookies = _load_cookies_netscape(cookies_path)

    # Headless by default (server-friendly)
    headless = not headed

    # If user asked for headed but no DISPLAY, we still try; Playwright may fail.
    if headed and not os.environ.get("DISPLAY"):
        print("[WARN] --headed requested but DISPLAY is not set. On headless servers, use headless (default) or run via Xvfb.")
        print("       Example: xvfb-run -a python fbreelz_phase1_playwright_v2.py --headed --max 30")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent=os.environ.get(
                "FBREELZ_UA",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
        )

        if cookies:
            # Playwright requires the domain without leading dot for some cookies;
            # but typically accepts both. We'll add as-is.
            context.add_cookies(cookies)
            print(f"[OK] Loaded {len(cookies)} cookies from {cookies_path}")

        page = context.new_page()

        last_html: Optional[str] = None
        last_url: Optional[str] = None

        for url in SAVED_URLS:
            try:
                last_url = url
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(1500)
                last_html = page.content()
                # If we got the "not available" interstitial, try next URL
                if last_html and "Facebook is not available on this browser" in last_html:
                    print(f"[WARN] Interstitial on {url} - trying alternate endpoint...")
                    continue
                break
            except PWTimeoutError:
                print(f"[WARN] Timeout loading {url} - trying next...")
                continue

        if not last_html:
            print("[ERR] Could not load Saved page with Playwright.")
            browser.close()
            return 2

        DEBUG_HTML.write_text(last_html, encoding="utf-8")
        print(f"[OK] Wrote HTML debug to {DEBUG_HTML}")

        links = _extract_saved_links(last_html)
        if not links:
            print("[ERR] No reel/video links found in HTML. You may need fresher cookies.")
            browser.close()
            return 3

        links = links[:max_items]
        # Create a Phase-1-ish structure compatible with Phase-2 (graphql_edges style)
        edges = []
        for u in links:
            edges.append({"node": {"savable": {"__typename": "Video", "savable_permalink": u}}})

        payload = {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "detected_format": "graphql_edges",
            "data": {"viewer": {"saver_info": {"all_saves": {"edges": edges}}}},
        }

        OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[OK] Wrote Phase-1 JSON to {OUT_JSON}")
        print(f"[OK] Items: {len(edges)} (max={max_items})")

        browser.close()
        return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="FBReelz Phase 1 via Playwright (Saved items)")
    ap.add_argument("--max", type=int, default=30, help="Max saved items to capture (default: 30)")
    ap.add_argument("--headed", action="store_true", help="Run with a visible browser (requires DISPLAY or Xvfb)")
    args = ap.parse_args()
    raise SystemExit(main(args.max, args.headed))
