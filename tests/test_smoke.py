"""Smoke tests for the Phase 2 and playlist scripts. No network, no yt-dlp needed.

Run: python tests/test_smoke.py   (or: pytest tests)
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _run(script, *args, env=None):
    return subprocess.run(
        [sys.executable, str(ROOT / script), *args],
        capture_output=True, text=True, env={**os.environ, **(env or {})}, check=True,
    )


def test_phase2_uses_fbreelz_data_dir():
    with tempfile.TemporaryDirectory() as d:
        data = Path(d)
        edge = {"node": {"savable": {"savable_permalink": "https://www.facebook.com/reel/123"}}}
        (data / "saved_items.json").write_text(json.dumps(
            {"data": {"viewer": {"saver_info": {"all_saves": {"edges": [edge]}}}}}))
        _run("scripts/fbreelz_phase2_resolve.py", "--no-ytdlp", env={"FBREELZ_DATA_DIR": d})
        resolved = json.loads((data / "resolved_items.json").read_text())
        assert resolved["items"][0]["source_url"] == "https://www.facebook.com/reel/123"
        assert "https://www.facebook.com/reel/123" in (data / "fbreelz.m3u").read_text()


def test_cache_playlist_reads_downloaded_path():
    with tempfile.TemporaryDirectory() as d:
        data = Path(d)
        (data / "cache").mkdir()
        (data / "cache" / "facebook_999.mp4").write_bytes(b"")
        # /videos/ links don't match the filename regex, so this only passes via downloaded_path
        item = {"source_url": "https://www.facebook.com/x/videos/999", "title": "Clip",
                "duration": 5, "downloaded_path": "/app/data/cache/facebook_999.mp4"}
        (data / "resolved_items.json").write_text(json.dumps({"items": [item]}))
        out = data / "out.m3u"
        _run("make_cache_playlist.py", "--resolved", str(data / "resolved_items.json"),
             "--cache-dir", str(data / "cache"), "--output", str(out), "--base-url", "http://host/")
        assert "http://host/cache/facebook_999.mp4" in out.read_text().splitlines()


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
