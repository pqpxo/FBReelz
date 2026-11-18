"""Smoke tests: server starts, main routes respond, admin routes need a login.

Needs node and `npm ci` in backend/. Run: python tests/test_smoke.py  (or: pytest tests)
Inside the container: docker exec fbreelz python /app/tests/test_smoke.py
"""

import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Repo layout, or the container layout (/app/backend + /app/scripts)
SERVER = next(p for p in [ROOT / "deploy" / "server-wrapper.js", ROOT / "backend" / "server-wrapper.js"] if p.exists())
PLAYLIST = next(p for p in [ROOT / "make_cache_playlist.py", ROOT / "scripts" / "make_cache_playlist.py"] if p.exists())
VIDEO = "Facebook_Video_111_111.mp4"


def _request(base, path, method="GET", body=None, token=None):
    req = urllib.request.Request(base + path, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def test_server_routes_and_admin_auth():
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        backend = d / "backend"
        shutil.copytree(SERVER.parent.parent / "backend", backend)  # node_modules + cleanup-watched.js
        shutil.copy(SERVER, backend / "server-wrapper.js")
        (d / "data" / "cache").mkdir(parents=True)
        (d / "data" / "cache" / VIDEO).write_bytes(b"0123456789")
        (d / "web").mkdir()
        (d / "web" / "index.html").write_text("<html>ok</html>")
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        env = {**os.environ, "PORT": str(port), "ADMIN_PASSWORD": "test-pass",
               "FBREELZ_DATA_DIR": str(d / "data"), "VIDEO_DIR": str(d / "data" / "cache"),
               "WATCHED_FILE": str(d / "data" / "watched.json"), "WEB_DIR": str(d / "web"),
               "FBREELZ_COOKIES": str(d / "cookies.txt"), "SCRIPTS_DIR": str(d)}
        proc = subprocess.Popen(["node", str(backend / "server-wrapper.js")], env=env,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        base = f"http://127.0.0.1:{port}"
        try:
            for _ in range(50):
                try:
                    if _request(base, "/api/health")[0] == 200:
                        break
                except OSError:
                    time.sleep(0.1)

            assert _request(base, "/")[0] == 200
            status, body = _request(base, "/api/videos")
            assert status == 200
            assert json.loads(body)["videos"][0]["id"] == "111"  # Facebook ID, not list position
            assert _request(base, "/api/video/" + VIDEO)[0] == 200
            assert _request(base, "/api/video/..%2Fwatched.json")[0] in (403, 404)

            # Admin routes are locked without a token
            for path in ["/api/admin/purge", "/api/admin/phase1", "/api/admin/cleanup"]:
                assert _request(base, path, "POST")[0] == 401, path
            assert _request(base, "/api/admin/cookies")[0] == 401
            assert _request(base, "/api/admin/login", "POST", {"password": "wrong"})[0] == 401

            status, body = _request(base, "/api/admin/login", "POST", {"password": "test-pass"})
            token = json.loads(body)["token"]
            assert status == 200 and token
            assert _request(base, "/api/admin/cookies", token=token)[0] == 404  # authorised, no file yet
            assert (d / "data" / "cache" / VIDEO).exists()
        finally:
            proc.terminate()
            proc.wait(timeout=5)


def test_cache_playlist_reads_phase2_videos():
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "cache").mkdir()
        (d / "cache" / VIDEO).write_bytes(b"x" * 2048)
        (d / "resolved_items.json").write_text(json.dumps({"videos": [{"filename": VIDEO, "title": "Clip"}]}))
        out = d / "out.m3u"
        subprocess.run([sys.executable, str(PLAYLIST), "--resolved", str(d / "resolved_items.json"),
                        "--cache-dir", str(d / "cache"), "--output", str(out), "--base-url", "http://host/"],
                       check=True, capture_output=True)
        assert f"http://host/cache/{VIDEO}" in out.read_text().splitlines()


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
