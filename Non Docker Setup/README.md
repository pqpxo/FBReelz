# Non-Docker setup (v1)

This option runs everything directly on the host using:
- Python venv (Playwright for Phase 1)
- systemd services/timers (optional)
- NGINX to serve playlists and cached MP4s

## 1) Install prerequisites

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx ffmpeg \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2t64 libpangocairo-1.0-0 libpango-1.0-0 libgtk-3-0
```

## 2) Copy this folder to the new host

```bash
sudo mkdir -p /opt/fbreelz
sudo chown -R $USER:$USER /opt/fbreelz
cp -r non_docker_setup/* /opt/fbreelz/
```

## 3) Create venv + install dependencies

```bash
cd /opt/fbreelz
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m playwright install chromium
```

## 4) Put your cookies in place

```bash
mkdir -p /opt/fbreelz/secrets
nano /opt/fbreelz/secrets/cookies.txt
chmod 600 /opt/fbreelz/secrets/cookies.txt
```

## 5) Run Phase 1 + Phase 2

```bash
source /opt/fbreelz/.venv/bin/activate
python /opt/fbreelz/fbreelz_phase1_playwright.py --max 30
python /opt/fbreelz/fbreelz_phase2_resolve.py --download
python /opt/fbreelz/make_cache_playlist.py --base-url http://YOUR_SERVER_IP/cache/ --out /opt/fbreelz/data/fbreelz_cache_http.m3u
```

## 6) NGINX

```bash
sudo cp /opt/fbreelz/nginx/fbreelz.conf /etc/nginx/sites-available/fbreelz
sudo ln -sf /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/fbreelz
sudo nginx -t && sudo systemctl reload nginx
```

Open:
- `http://YOUR_SERVER_IP/fbreelz_cache_http.m3u`
- `http://YOUR_SERVER_IP/cache/<file>.mp4`

