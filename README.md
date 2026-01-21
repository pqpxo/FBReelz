# Docker setup (v1)

This option:
- runs your FBReelz scripts inside a container called `fbreelz`
- keeps cookies and data on the host under `/opt/fbreelz/`
- uses **NGINX on the host** to serve the web UI + cached MP4s + playlists

## 1) Install prerequisites (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo systemctl enable --now docker nginx
```

## 2) Copy this folder to the new host

Recommended destination:
```bash
sudo mkdir -p /opt/fbreelz
sudo chown -R $USER:$USER /opt/fbreelz
cp -r docker_setup/* /opt/fbreelz/
```

## 3) Put your cookies in place

```bash
mkdir -p /opt/fbreelz/secrets
nano /opt/fbreelz/secrets/cookies.txt
chmod 600 /opt/fbreelz/secrets/cookies.txt
```

## 4) Build + start container

```bash
cd /opt/fbreelz
docker compose up -d --build
docker exec -it fbreelz python /app/fbreelz_phase1_graphql.py --max 30
docker exec -it fbreelz python /app/fbreelz_phase2_resolve.py --download
```

## 5) Generate HTTP playlist for remote streaming (LAN)

This creates `/opt/fbreelz/data/fbreelz_cache_http.m3u` pointing at your server IP.

```bash
python3 /opt/fbreelz/make_cache_playlist.py --base-url http://YOUR_SERVER_IP/cache/ --out /opt/fbreelz/data/fbreelz_cache_http.m3u
```

## 6) NGINX

1) Copy your web UI into `/var/www/fbreelz` (or change `root` in the config).
2) Enable the NGINX site (see `nginx/fbreelz.conf` here).

```bash
sudo cp /opt/fbreelz/nginx/fbreelz.conf /etc/nginx/sites-available/fbreelz
sudo ln -sf /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/fbreelz
sudo nginx -t && sudo systemctl reload nginx
```

Then open:
- `http://YOUR_SERVER_IP/` (web UI)
- `http://YOUR_SERVER_IP/fbreelz_cache_http.m3u` (playlist)

=======
# FBReelz

FBReelz is a headless-friendly toolchain for:
- Pulling Facebook Saved videos
- Downloading reels/videos locally
- Generating M3U playlists
- Serving content over NGINX

## Features
- Headless Playwright scraping
- yt-dlp based downloads
- HTTP-friendly playlists
- Docker-first deployment

## Requirements
- Docker + Docker Compose
- Facebook cookies (Netscape format)
- NGINX (host-level)

## Quick start
```bash
cp secrets/cookies.example.txt secrets/cookies.txt
docker compose up -d --build
