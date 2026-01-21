## version 5
"""FBReelz Phase 2: Resolve Phase-1 saved items into a clean list + VLC playlist(s).

v5 changes
- Adds a download progress counter with titles: "Downloaded 3 / 30: <title>".
- Writes cache playlist AND (optionally) an HTTP playlist if you pass --http-base.

Everything else from v4 is retained.

Usage (inside container)
  python /app/fbreelz_phase2_resolve.py --download

Example (HTTP playlist for remote streaming)
  python /app/fbreelz_phase2_resolve.py --download --http-base http://192.168.1.226:8081
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_INPUT = Path("/app/data/saved_items.json")
DEFAULT_OUTPUT = Path("/app/data/resolved_items.json")
DEFAULT_M3U = Path("/app/data/fbreelz.m3u")
DEFAULT_CACHE_M3U = Path("/app/data/fbreelz_cache.m3u")
DEFAULT_HTTP_M3U = Path("/app/data/fbreelz_cache_http.m3u")
DEFAULT_CACHE_DIR = Path("/app/data/cache")
DEFAULT_SECRETS_COOKIES = Path("/app/secrets/cookies.txt")
DEFAULT_RUNTIME_COOKIES = Path("/app/data/cookies_runtime.txt")


@dataclass
class ItemOut:
    source_url: str
    kind: str = ""
    resolved_url: Optional[str] = None
    title: str = ""
    duration: Optional[int] = None
    extractor: Optional[str] = None
    status: str = "ok"  # ok | error
    error: Optional[str] = None
    downloaded_path: Optional[str] = None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_newlines(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def _load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _detect_edges(payload: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
    if isinstance(payload.get("items"), list):
        return "mbasic_items", payload.get("items") or []

    edges = (
        payload.get("data", {})
        .get("viewer", {})
        .get("saver_info", {})
        .get("all_saves", {})
        .get("edges", [])
    )
    if isinstance(edges, list):
        return "graphql_edges", edges

    return "unknown", []


def _extract_source_urls(detected_format: str, rows: List[Dict[str, Any]]) -> List[Tuple[str, str, Optional[int]]]:
    out: List[Tuple[str, str, Optional[int]]] = []

    if detected_format == "mbasic_items":
        for r in rows:
            url = (r or {}).get("url") or ""
            title = (r or {}).get("title") or ""
            dur = (r or {}).get("duration")
            if url:
                out.append((url, title, dur if isinstance(dur, int) else None))
        return out

    if detected_format == "graphql_edges":
        for e in rows:
            node = (e or {}).get("node") or {}
            savable = node.get("savable") or {}
            url = savable.get("savable_permalink") or savable.get("url") or ""

            title = ""
            st = savable.get("savable_title") or {}
            if isinstance(st, dict):
                title = st.get("text") or ""
            if not title:
                t = savable.get("title")
                if isinstance(t, dict):
                    title = t.get("text") or ""
                elif isinstance(t, str):
                    title = t

            dur = savable.get("playable_duration")
            out.append((url, title or "", dur if isinstance(dur, int) else None))
        return out

    return out


def _yt_dlp_exists() -> bool:
    try:
        subprocess.run(["yt-dlp", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception:
        return False


def _ensure_runtime_cookies(secrets_cookies: Path, runtime_cookies: Path) -> Optional[Path]:
    if not secrets_cookies.exists():
        return None
    runtime_cookies.parent.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copyfile(secrets_cookies, runtime_cookies)
        return runtime_cookies
    except Exception:
        return secrets_cookies


def _yt_dlp_info(url: str, cookies: Optional[Path], user_agent: Optional[str]) -> Tuple[Optional[str], Optional[int], Optional[str], Optional[str]]:
    cmd = ["yt-dlp", "-J", "--no-playlist", url]
    if user_agent:
        cmd += ["--user-agent", user_agent]
    if cookies and cookies.exists():
        cmd += ["--cookies", str(cookies)]

    try:
        p = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(p.stdout or "{}")
        resolved_url = data.get("url") or None
        duration = data.get("duration") if isinstance(data.get("duration"), int) else None
        title = data.get("title") or None
        extractor = data.get("extractor_key") or data.get("extractor") or None
        return resolved_url, duration, title, extractor
    except subprocess.CalledProcessError as e:
        err = (e.stderr or e.stdout or "").strip()
        raise RuntimeError(err[:3000] if err else "yt-dlp failed")
    except Exception as e:
        raise RuntimeError(str(e)[:3000])


def _yt_dlp_download(url: str, cache_dir: Path, cookies: Optional[Path], user_agent: Optional[str]) -> str:
    cache_dir.mkdir(parents=True, exist_ok=True)

    outtmpl = str(cache_dir / "facebook_%(id)s.%(ext)s")
    cmd = ["yt-dlp", "--no-playlist", "-o", outtmpl, url]
    if user_agent:
        cmd += ["--user-agent", user_agent]
    if cookies and cookies.exists():
        cmd += ["--cookies", str(cookies)]

    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        err = (p.stderr or p.stdout or "").strip()
        raise RuntimeError(err[:3000] if err else "yt-dlp download failed")

    # Best-effort: newest facebook_*.mp4
    candidates = sorted(cache_dir.glob("facebook_*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True)
    if candidates:
        return str(candidates[0])

    any_files = sorted([x for x in cache_dir.iterdir() if x.is_file()], key=lambda x: x.stat().st_mtime, reverse=True)
    if any_files:
        return str(any_files[0])

    raise RuntimeError("download succeeded but no file found in cache_dir")


def _write_m3u(path: Path, title: str, items: List[ItemOut]) -> None:
    lines: List[str] = ["#EXTM3U", f"#PLAYLIST:{title}"]

    for it in items:
        t = _strip_newlines(it.title) or it.source_url
        dur = it.duration if isinstance(it.duration, int) else -1
        lines.append(f"#EXTINF:{dur},{t}")
        lines.append(it.resolved_url or it.source_url)

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_cache_m3u(path: Path, title: str, items: List[ItemOut], cache_dir: Path) -> None:
    lines: List[str] = ["#EXTM3U", f"#PLAYLIST:{title}"]
    for it in items:
        if not it.downloaded_path:
            continue
        t = _strip_newlines(it.title) or it.source_url
        dur = it.duration if isinstance(it.duration, int) else -1
        lines.append(f"#EXTINF:{dur},{t}")
        try:
            p = Path(it.downloaded_path)
            rel = p.relative_to(cache_dir)
            lines.append(str(Path("cache") / rel.name))
        except Exception:
            lines.append(it.downloaded_path)

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_http_m3u(path: Path, title: str, items: List[ItemOut], http_base: str) -> None:
    base = http_base.rstrip("/")
    lines: List[str] = ["#EXTM3U", f"#PLAYLIST:{title}"]
    for it in items:
        if not it.downloaded_path:
            continue
        t = _strip_newlines(it.title) or it.source_url
        dur = it.duration if isinstance(it.duration, int) else -1
        lines.append(f"#EXTINF:{dur},{t}")
        # The file will be served from /app/data (host: /opt/fbreelz/data)
        # So cache files are under /cache/<filename>
        fname = Path(it.downloaded_path).name
        lines.append(f"{base}/cache/{fname}")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Resolve FBReelz Phase-1 saved items into a normalized list + optional playlist")
    ap.add_argument("--input", default=str(DEFAULT_INPUT), help=f"Path to Phase-1 JSON (default: {DEFAULT_INPUT})")
    ap.add_argument("--output", default=str(DEFAULT_OUTPUT), help=f"Path to write resolved_items.json (default: {DEFAULT_OUTPUT})")
    ap.add_argument("--m3u", default=str(DEFAULT_M3U), help=f"Path to write VLC playlist (default: {DEFAULT_M3U})")
    ap.add_argument("--cache-m3u", default=str(DEFAULT_CACHE_M3U), help=f"Path to write cache playlist (default: {DEFAULT_CACHE_M3U})")
    ap.add_argument("--http-m3u", default=str(DEFAULT_HTTP_M3U), help=f"Path to write HTTP cache playlist (default: {DEFAULT_HTTP_M3U})")
    ap.add_argument("--http-base", default=None, help="Base URL for HTTP playlist, e.g. http://192.168.1.226:8081")
    ap.add_argument("--max", type=int, default=200, help="Max items to resolve (default: 200)")
    ap.add_argument("--no-ytdlp", action="store_true", help="Skip yt-dlp resolution")
    ap.add_argument("--download", action="store_true", help="Download media to /app/data/cache")
    ap.add_argument("--playlist-title", default="FBReelz", help="Playlist title")
    ap.add_argument("--user-agent", default=None, help="User-Agent to pass to yt-dlp")
    args = ap.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.output)
    m3u_path = Path(args.m3u)
    cache_m3u_path = Path(args.cache_m3u)
    http_m3u_path = Path(args.http_m3u)

    payload = _load_json(input_path)
    detected_format, rows = _detect_edges(payload)

    src_rows = _extract_source_urls(detected_format, rows)
    src_rows = src_rows[: max(0, int(args.max))]

    use_ytdlp = (not args.no_ytdlp) and _yt_dlp_exists()
    if use_ytdlp:
        print("[OK] yt-dlp available; will attempt to resolve media URLs.")
    else:
        if args.no_ytdlp:
            print("[INFO] --no-ytdlp set; skipping yt-dlp resolution.")
        else:
            print("[WARN] yt-dlp not available; will write playlists using source URLs.")

    runtime_cookies = _ensure_runtime_cookies(DEFAULT_SECRETS_COOKIES, DEFAULT_RUNTIME_COOKIES)

    items_out: List[ItemOut] = []

    total = len(src_rows)
    downloads_done = 0

    for i, (url, title_hint, dur_hint) in enumerate(src_rows, 1):
        title_hint = title_hint or ""
        dur_hint = dur_hint if isinstance(dur_hint, int) else None

        it = ItemOut(source_url=url, title=_strip_newlines(title_hint), duration=dur_hint)

        if use_ytdlp:
            try:
                resolved_url, duration, title, extractor = _yt_dlp_info(url, cookies=runtime_cookies, user_agent=args.user_agent)
                it.resolved_url = resolved_url
                it.duration = duration if duration is not None else it.duration
                it.title = _strip_newlines(title) if title else (it.title or "")
                it.extractor = extractor
                it.status = "ok"
            except Exception as e:
                it.status = "error"
                it.error = str(e)

        if args.download:
            # download only if yt-dlp is available
            if use_ytdlp:
                try:
                    # print progress before download starts
                    label = it.title or it.source_url
                    print(f"[DL] Downloaded {downloads_done} / {total}: (next) {label}")

                    downloaded = _yt_dlp_download(url, cache_dir=DEFAULT_CACHE_DIR, cookies=runtime_cookies, user_agent=args.user_agent)
                    it.downloaded_path = downloaded
                    downloads_done += 1

                    label2 = it.title or it.source_url
                    print(f"[OK] Downloaded {downloads_done} / {total}: {label2}")
                except Exception as e:
                    it.status = "error"
                    it.error = (it.error or "") + f"\ndownload_error: {e}"
            else:
                it.status = "error"
                it.error = (it.error or "") + "\ndownload_error: yt-dlp not available"

        items_out.append(it)

    out_payload = {
        "generated_at_utc": _utc_now_iso(),
        "input": str(input_path),
        "detected_format": detected_format,
        "input_count": len(src_rows),
        "processed_count": len(src_rows),
        "resolved_count": len(items_out),
        "items": [asdict(x) for x in items_out],
    }

    out_path.write_text(json.dumps(out_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    _write_m3u(m3u_path, args.playlist_title, items_out)

    if args.download:
        _write_cache_m3u(cache_m3u_path, f"{args.playlist_title} (Cache)", items_out, cache_dir=DEFAULT_CACHE_DIR)
        if args.http_base:
            _write_http_m3u(http_m3u_path, f"{args.playlist_title} (Cache HTTP)", items_out, http_base=str(args.http_base))

    print(f"[OK] Wrote resolved items to: {out_path}")
    print(f"[OK] Wrote VLC playlist to: {m3u_path}")
    if args.download:
        print(f"[OK] Wrote cache playlist to: {cache_m3u_path}")
        if args.http_base:
            print(f"[OK] Wrote HTTP cache playlist to: {http_m3u_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
