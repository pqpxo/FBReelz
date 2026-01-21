## version 2
#!/usr/bin/env python3
"""
Create an M3U playlist that points at your *cached* FBReelz MP4 files.

Why you need this:
- Your HTTP server is serving from: /opt/fbreelz/data
- But your previous playlist contained absolute paths like: /opt/fbreelz/data/cache/xyz.mp4
- When VLC fetched the playlist over HTTP, it tried to GET:
    /opt/fbreelz/data/cache/xyz.mp4
  which does NOT exist under the web root, so you got 404s.

This script fixes that by writing either:
- relative paths like: cache/xyz.mp4  (works when serving /opt/fbreelz/data), or
- full URLs like: http://<host>:8081/cache/xyz.mp4

Usage examples:
  # 1) Create a playlist with RELATIVE paths (recommended if serving /opt/fbreelz/data)
  python3 make_cache_playlist_v2.py

  # 2) Create a playlist with FULL URL entries (recommended for remote streaming)
  python3 make_cache_playlist_v2.py --base-url http://192.168.1.226:8081

  # 3) Custom paths
  python3 make_cache_playlist_v2.py --cache-dir /opt/fbreelz/data/cache --output /opt/fbreelz/data/fbreelz_cache_http.m3u --base-url http://192.168.1.226:8081

Then:
  cd /opt/fbreelz/data
  python3 -m http.server 8081 --bind 0.0.0.0

On your Windows VLC:
  Media -> Open Network Stream
  http://192.168.1.226:8081/fbreelz_cache_http.m3u
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urljoin

def _safe_title(s: str) -> str:
    s = (s or "").strip().replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    s = s.replace(",", " ")
    return s[:220] if len(s) > 220 else s

def main() -> int:
    ap = argparse.ArgumentParser(description="Generate an M3U playlist for cached FBReelz MP4s.")
    ap.add_argument("--resolved", default="/opt/fbreelz/data/resolved_items.json",
                    help="Path to resolved_items.json (default: /opt/fbreelz/data/resolved_items.json)")
    ap.add_argument("--cache-dir", default="/opt/fbreelz/data/cache",
                    help="Cache directory containing downloaded MP4s (default: /opt/fbreelz/data/cache)")
    ap.add_argument("--output", default="/opt/fbreelz/data/fbreelz_cache_http.m3u",
                    help="Output M3U path (default: /opt/fbreelz/data/fbreelz_cache_http.m3u)")
    ap.add_argument("--base-url", default="",
                    help="If set, write full URLs like http://host:8081/cache/file.mp4")
    ap.add_argument("--playlist-title", default="FBReelz (Cache)",
                    help="Playlist title (default: FBReelz (Cache))")
    args = ap.parse_args()

    resolved_path = Path(args.resolved)
    cache_dir = Path(args.cache_dir)
    out_path = Path(args.output)

    if not resolved_path.exists():
        raise SystemExit(f"[ERR] resolved file not found: {resolved_path}")
    if not cache_dir.exists():
        raise SystemExit(f"[ERR] cache dir not found: {cache_dir}")

    data = json.loads(resolved_path.read_text(encoding="utf-8"))
    items = data.get("items", []) or []

    playable: list[tuple[dict, str]] = []
    for it in items:
        cached = it.get("downloaded_file") or it.get("cached_file") or ""
        if cached:
            fname = Path(cached).name
        else:
            src = (it.get("source_url") or "").strip()
            m = re.search(r"/reel/(\d+)", src) or re.search(r"[?&]v=(\d+)", src)
            fname = f"facebook_{m.group(1)}.mp4" if m else ""

        if not fname:
            continue

        fpath = cache_dir / fname
        if fpath.exists() and fpath.is_file():
            playable.append((it, fname))

    if not playable:
        raise SystemExit("[ERR] No cached MP4s found. Check /opt/fbreelz/data/cache and your resolved_items.json")

    base_url = args.base_url.strip()
    if base_url and not base_url.endswith("/"):
        base_url += "/"

    lines: list[str] = ["#EXTM3U", f"#PLAYLIST:{args.playlist_title}"]

    for it, fname in playable:
        title = _safe_title(it.get("title") or "Video")
        dur = it.get("duration")
        dur = int(dur) if isinstance(dur, (int, float)) else -1
        lines.append(f"#EXTINF:{dur},{title}")

        if base_url:
            lines.append(urljoin(base_url, f"cache/{fname}"))
        else:
            # Relative path (NO leading slash) so VLC requests /cache/<fname>
            lines.append(f"cache/{fname}")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] Wrote: {out_path}")
    print(f"[OK] Items: {len(playable)}")
    if base_url:
        print(f"[TIP] Open in VLC (network): {urljoin(base_url, out_path.name)}")
    else:
        print(f"[TIP] Serve /opt/fbreelz/data and open: http://<host>:8081/{out_path.name}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
