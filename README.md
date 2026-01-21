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
