# Non-Docker setup

Runs FBReelz directly on the host with:

- a Python venv (Playwright for Phase 1, yt-dlp for Phase 2)
- an optional systemd timer for a nightly refresh
- NGINX to serve playlists and cached MP4s

The scripts default to `/opt/fbreelz/data` and `/opt/fbreelz/secrets/cookies.txt`, so no environment variables are needed if you install to `/opt/fbreelz`.

<br>

## 1) Install prerequisites

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip nginx ffmpeg
```

<br>

## 2) Clone the repo

```bash
sudo git clone https://github.com/pqpxo/FBReelz.git /opt/fbreelz
sudo chown -R $USER:$USER /opt/fbreelz
cd /opt/fbreelz
cp scripts/*.py .
cp -r "Non Docker Setup/systemd" systemd
```

<br>

## 3) Create the venv and install dependencies

```bash
cd /opt/fbreelz
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
sudo .venv/bin/python -m playwright install-deps chromium
python -m playwright install chromium
```

<br>

## 4) Add your cookies

```bash
mkdir -p /opt/fbreelz/secrets
nano /opt/fbreelz/secrets/cookies.txt
chmod 600 /opt/fbreelz/secrets/cookies.txt
```

<br>

## 5) Run Phase 1 and Phase 2

```bash
source /opt/fbreelz/.venv/bin/activate
python /opt/fbreelz/fbreelz_phase1_playwright.py --max 30
python /opt/fbreelz/fbreelz_phase2_resolve.py --download --http-base http://YOUR_SERVER_IP
```

<br>

## 6) NGINX

```bash
sudo cp /opt/fbreelz/nginx/fbreelz.conf /etc/nginx/sites-available/fbreelz
sudo ln -sf /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/fbreelz
sudo nginx -t && sudo systemctl reload nginx
```

Open:

- `http://YOUR_SERVER_IP/fbreelz_cache_http.m3u`
- `http://YOUR_SERVER_IP/cache/<file>.mp4`

<br>

## 7) Nightly refresh (optional)

See [systemd/INSTALL.md](systemd/INSTALL.md).
