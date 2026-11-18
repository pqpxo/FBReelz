## version 3 - Enhanced Edition
#!/usr/bin/env python3
"""
Create M3U playlists for cached FBReelz videos - Enhanced

Improvements in v3:
- Fixed field name to match Phase 2 output (downloaded_path)
- Better file matching with multiple fallback strategies
- Validation of video files before adding to playlist
- Statistics and diagnostics
- Support for multiple video formats
- Better error handling

Usage:
  # Relative paths (for serving /opt/fbreelz/data)
  python3 make_cache_playlist.py

  # Full URLs (for remote streaming)
  python3 make_cache_playlist.py --base-url http://192.168.1.226:8081

  # Custom paths
  python3 make_cache_playlist.py \
    --resolved /opt/fbreelz/data/resolved_items.json \
    --cache-dir /opt/fbreelz/data/cache \
    --output /opt/fbreelz/data/my_playlist.m3u \
    --base-url http://192.168.1.226:8081

  # Verbose mode
  python3 make_cache_playlist.py --verbose
"""

import argparse
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv'}


def _safe_title(s: str) -> str:
    """Sanitize title for M3U format."""
    s = (s or "").strip().replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    s = s.replace(",", " ")
    return s[:220] if len(s) > 220 else s


def _extract_video_id(url: str) -> Optional[str]:
    """Extract Facebook video ID from URL."""
    patterns = [
        r'/reel/(\d+)',
        r'[?&]v=(\d+)',
        r'/videos/(\d+)',
        r'facebook\.com/\d+/videos/(\d+)',
    ]
    
    for pattern in patterns:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def _find_video_file(item: Dict, cache_dir: Path) -> Optional[Path]:
    """Find video file for item using multiple strategies."""
    
    # Strategy 1: Use downloaded_path field (Phase 2 v6)
    for field in ['downloaded_path', 'downloaded_file', 'cached_file']:
        path_str = item.get(field)
        if path_str:
            p = Path(path_str)
            if p.exists() and p.is_file():
                logger.debug(f"Found via {field}: {p.name}")
                return p
            # Try just the filename in cache_dir
            fname = p.name
            p2 = cache_dir / fname
            if p2.exists() and p2.is_file():
                logger.debug(f"Found via {field} (basename): {p2.name}")
                return p2
    
    # Strategy 2: Extract video ID and search cache
    source_url = item.get('source_url', '')
    video_id = _extract_video_id(source_url)
    
    if video_id:
        # Look for facebook_{id}.{ext}
        for ext in VIDEO_EXTENSIONS:
            p = cache_dir / f"facebook_{video_id}{ext}"
            if p.exists() and p.is_file():
                logger.debug(f"Found via video ID: {p.name}")
                return p
        
        # Look for any file containing the video ID
        for p in cache_dir.glob(f"*{video_id}*"):
            if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS:
                logger.debug(f"Found via ID pattern: {p.name}")
                return p
    
    return None


def _validate_video_file(path: Path) -> bool:
    """Check if file is a valid video."""
    if not path.exists():
        return False
    if not path.is_file():
        return False
    if path.suffix.lower() not in VIDEO_EXTENSIONS:
        return False
    if path.stat().st_size < 1024:  # At least 1KB
        logger.warning(f"File too small (likely corrupt): {path.name}")
        return False
    return True


def _get_file_stats(cache_dir: Path) -> Dict[str, int]:
    """Get statistics about cache directory."""
    stats = {
        'total_files': 0,
        'video_files': 0,
        'total_size_mb': 0
    }
    
    for p in cache_dir.iterdir():
        if p.is_file():
            stats['total_files'] += 1
            if p.suffix.lower() in VIDEO_EXTENSIONS:
                stats['video_files'] += 1
                stats['total_size_mb'] += p.stat().st_size / (1024 * 1024)
    
    return stats


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Generate M3U playlist for cached FBReelz videos (Enhanced)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create playlist with relative paths
  python3 make_cache_playlist.py

  # Create playlist with full URLs for remote streaming
  python3 make_cache_playlist.py --base-url http://192.168.1.100:8081

  # Verbose mode with diagnostics
  python3 make_cache_playlist.py --verbose
        """
    )
    ap.add_argument(
        "--resolved",
        default="/opt/fbreelz/data/resolved_items.json",
        help="Path to resolved_items.json (default: /opt/fbreelz/data/resolved_items.json)"
    )
    ap.add_argument(
        "--cache-dir",
        default="/opt/fbreelz/data/cache",
        help="Cache directory with MP4s (default: /opt/fbreelz/data/cache)"
    )
    ap.add_argument(
        "--output",
        default="/opt/fbreelz/data/fbreelz_cache_http.m3u",
        help="Output M3U path (default: /opt/fbreelz/data/fbreelz_cache_http.m3u)"
    )
    ap.add_argument(
        "--base-url",
        default="",
        help="Base URL for full paths (e.g., http://192.168.1.100:8081)"
    )
    ap.add_argument(
        "--playlist-title",
        default="FBReelz (Cache)",
        help="Playlist title (default: FBReelz (Cache))"
    )
    ap.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    args = ap.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    resolved_path = Path(args.resolved)
    cache_dir = Path(args.cache_dir)
    out_path = Path(args.output)

    # Validation
    if not resolved_path.exists():
        logger.error(f"Resolved file not found: {resolved_path}")
        return 1
    
    if not cache_dir.exists():
        logger.error(f"Cache directory not found: {cache_dir}")
        return 1

    # Load resolved items
    logger.info(f"Loading: {resolved_path}")
    try:
        data = json.loads(resolved_path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse JSON: {e}")
        return 1

    items = data.get("items", []) or []
    logger.info(f"Found {len(items)} items in resolved_items.json")

    # Get cache statistics
    cache_stats = _get_file_stats(cache_dir)
    logger.info(f"Cache directory: {cache_stats['video_files']} videos, "
                f"{cache_stats['total_size_mb']:.1f} MB total")

    # Process items
    playable: List[Tuple[Dict, Path]] = []
    not_found = 0
    invalid = 0

    for i, item in enumerate(items, 1):
        # Skip items marked as errors or skipped
        status = item.get('status', 'ok')
        if status in ['error', 'skipped']:
            logger.debug(f"[{i}/{len(items)}] Skipping (status={status})")
            continue

        # Find video file
        video_file = _find_video_file(item, cache_dir)
        
        if not video_file:
            not_found += 1
            title = item.get('title', 'Unknown')
            url = item.get('source_url', '')
            logger.debug(f"[{i}/{len(items)}] Not found: {title} ({url})")
            continue
        
        # Validate video file
        if not _validate_video_file(video_file):
            invalid += 1
            logger.warning(f"[{i}/{len(items)}] Invalid video file: {video_file.name}")
            continue
        
        playable.append((item, video_file))
        logger.debug(f"[{i}/{len(items)}] Added: {video_file.name}")

    if not playable:
        logger.error("No playable videos found!")
        logger.error(f"Not found: {not_found}, Invalid: {invalid}")
        logger.error("Possible issues:")
        logger.error("  - Files haven't been downloaded yet (run Phase 2 with --download)")
        logger.error("  - Field name mismatch in resolved_items.json")
        logger.error("  - Files were moved or deleted")
        return 1

    logger.info(f"Found {len(playable)} playable videos")
    if not_found > 0:
        logger.warning(f"Not found: {not_found} videos")
    if invalid > 0:
        logger.warning(f"Invalid: {invalid} videos")

    # Build playlist
    base_url = args.base_url.strip()
    if base_url and not base_url.endswith("/"):
        base_url += "/"

    lines: List[str] = ["#EXTM3U", f"#PLAYLIST:{args.playlist_title}"]

    for item, video_file in playable:
        title = _safe_title(item.get("title") or "Video")
        dur = item.get("duration")
        dur = int(dur) if isinstance(dur, (int, float)) and dur > 0 else 0
        
        lines.append(f"#EXTINF:{dur},{title}")

        if base_url:
            # Full URL
            url = urljoin(base_url, f"cache/{video_file.name}")
            lines.append(url)
        else:
            # Relative path (no leading slash)
            lines.append(f"cache/{video_file.name}")

    # Write playlist
    try:
        out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        logger.info(f"✓ Wrote playlist: {out_path}")
        logger.info(f"✓ Total items: {len(playable)}")
    except Exception as e:
        logger.error(f"Failed to write playlist: {e}")
        return 1

    # Show usage instructions
    if base_url:
        playlist_url = urljoin(base_url, out_path.name)
        logger.info(f"\n=== Usage ===")
        logger.info(f"Open in VLC (network stream): {playlist_url}")
    else:
        logger.info(f"\n=== Usage ===")
        logger.info(f"Serve /opt/fbreelz/data with: python3 -m http.server 8081")
        logger.info(f"Then open in VLC: http://<host>:8081/{out_path.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
