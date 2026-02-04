
<img src="https://github.com/pqpxo/logos/blob/main/reelz.fw.png" width="400">

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
```


---
<br />

# Docker setup

This option:
- runs your FBReelz scripts inside a container called `fbreelz`
- keeps cookies and data on the host under `/opt/fbreelz/`
- uses **NGINX on the host** to serve the web UI + cached MP4s + playlists

### 1) Install prerequisites (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo systemctl enable --now docker nginx
```

### 2) Copy this folder to the new host

Recommended destination:
```bash
sudo mkdir -p /opt/fbreelz
sudo chown -R $USER:$USER /opt/fbreelz
cp -r docker_setup/* /opt/fbreelz/
```

### 3) Put your cookies in place

Cookies are obtained using the [`cookies.txt` Firefox extension](https://github.com/hrdl-github/cookies-txt).

```bash
mkdir -p /opt/fbreelz/secrets
nano /opt/fbreelz/secrets/cookies.txt
chmod 600 /opt/fbreelz/secrets/cookies.txt
```

### 4) Build + start container

```bash
cd /opt/fbreelz
docker compose up -d --build
docker exec -it fbreelz python /app/fbreelz_phase1_graphql.py --max 30
docker exec -it fbreelz python /app/fbreelz_phase2_resolve.py --download
```

### 5) Generate HTTP playlist for remote streaming (LAN)

This creates `/opt/fbreelz/data/fbreelz_cache_http.m3u` pointing at your server IP.

```bash
python3 /opt/fbreelz/make_cache_playlist.py \
  --base-url http://YOUR_SERVER_IP/cache/ \
  --out /opt/fbreelz/data/fbreelz_cache_http.m3u
```

### 6) NGINX

```bash
sudo cp /opt/fbreelz/nginx/fbreelz.conf /etc/nginx/sites-available/fbreelz
sudo ln -sf /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/fbreelz
sudo nginx -t && sudo systemctl reload nginx
```

Then open:
- `http://YOUR_SERVER_IP/` (Web UI)
- `http://YOUR_SERVER_IP/fbreelz_cache_http.m3u` (playlist)

---
<br />

# Web UI Setup (NGINX-served)

The FBReelz Web UI is a **static frontend** served directly by NGINX on the host.
It does **not** run inside Docker and does **not** require Node.js at runtime.

### Architecture overview

```
Browser
  ├─ /                → Static Web UI (HTML / JS / CSS)
  ├─ /cache/*.mp4     → Downloaded Facebook videos
  ├─ /fbreelz_*.m3u   → Playlists
  └─ /api/*           → (optional) backend
```

Docker is only responsible for **scraping, downloading, and playlist generation**.

---

### Web UI directory structure

```text
/var/www/fbreelz/
├── index.html
├── assets/
│   ├── app.js
│   ├── styles.css
│   └── icons/
```

Update the NGINX `root` directive if you change this path.

---

### Copy the Web UI to the host

```bash
sudo mkdir -p /var/www/fbreelz
sudo cp -r web_ui/* /var/www/fbreelz/
sudo chown -R www-data:www-data /var/www/fbreelz
```

Permissions:

```bash
sudo find /var/www/fbreelz -type d -exec chmod 755 {} \;
sudo find /var/www/fbreelz -type f -exec chmod 644 {} \;
```

---

### How videos are exposed

Videos are downloaded to:

```text
/opt/fbreelz/data/cache/*.mp4
```

NGINX exposes them as:

```
http://YOUR_SERVER_IP/cache/*.mp4
```

---

### Playlists

Local:
```text
/opt/fbreelz/data/fbreelz_cache.m3u
```

LAN / remote:
```text
/opt/fbreelz/data/fbreelz_cache_http.m3u
```

Example entry:

```m3u
#EXTINF:97,Ten Years of Dancehall
http://192.168.x.xxx/cache/facebook_2107482286680757.mp4
```

---

### NGINX video notes

Recommended:
- `sendfile on`
- `tcp_nopush on`
- correct MIME types for `.mp4` and `.m3u`

Avoid:
- `aio on`
- gzip on video files

---

### Access points

- Web UI: `http://YOUR_SERVER_IP/`
- Playlist: `http://YOUR_SERVER_IP/fbreelz_cache_http.m3u`
- Videos: `http://YOUR_SERVER_IP/cache/`

---

### Security notes

- Never expose `cookies.txt`
- Restrict `/opt/fbreelz/secrets`
- Use HTTPS if exposed beyond LAN

---

## License

Private / internal use. Adjust as required.

