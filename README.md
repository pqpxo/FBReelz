<p align="center">
  <img src="https://raw.githubusercontent.com/pqpxo/logos/main/reelz.fw.png" width="400" alt="FBReelz logo">
</p>

<h1 align="center">FBReelz</h1>

<br>

<p align="center">
  Pull the videos you saved on Facebook down to your own server and swipe through them in a self-hosted, full-screen player.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="https://makes.swakes.co.uk/fbreelz/">Blog write-up</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>



## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Getting your Facebook cookies](#getting-your-facebook-cookies)
- [Using the player](#using-the-player)
- [Environment variables](#environment-variables)
- [Ports and paths](#ports-and-paths)
- [Command line](#command-line)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Repository layout](#repository-layout)
- [Licence](#licence)

<br>

## What it does

Facebook's **Saved** list is easy to add to and hard to get anything back out of. FBReelz:

- scrolls your Saved page in headless Chromium (Playwright) using your browser cookies and collects every reel and video link
- downloads each one as an MP4 with yt-dlp, skipping videos you have already watched and cleaned up
- serves them in a swipeable, full-screen web player with watched marks, colour themes and an info panel
- deletes watched videos after a set number of days (Cleanup), so the cache doesn't grow forever
- can send a Pushover notification when a download run finishes

<p align="center">
  <img src="docs/screenshot.jpg" width="640" alt="FBReelz player showing a saved video with the Mark, Phase 1, Phase 2, Cleanup, Purge, Restart and NGINX controls">
</p>

> [!NOTE]
> Full write-up, background and lessons learned: [makes.swakes.co.uk/fbreelz](https://makes.swakes.co.uk/fbreelz/)

<br>

## How it works

```mermaid
flowchart LR
    A[cookies.txt] --> B[Phase 1<br>Playwright scrape]
    B -->|saved_items.json| C[Phase 2<br>yt-dlp download]
    C -->|data/cache/*.mp4| D[Node server :3001]
    D --> E[Web player]
    E -->|mark watched| F[watched.json]
    F -->|Cleanup after N days| C
```

Everything runs in one container. Supervisord keeps the Node server running, and the Node server runs the Python phases when you press **Phase 1** or **Phase 2** in the player.

<br>

## Requirements

- Linux host (Ubuntu or Raspberry Pi OS) with Docker and the Compose plugin
- Your Facebook cookies in Netscape `cookies.txt` format. See [Getting your Facebook cookies](#getting-your-facebook-cookies)

<br>

## Quick start

**1. Clone the repo**

```bash
git clone https://github.com/pqpxo/FBReelz.git fbreelz
cd fbreelz
```

**2. Set an admin password**

```bash
cp .env.example .env
nano .env                       # set ADMIN_PASSWORD
```

> [!IMPORTANT]
> The admin controls (Phase 1/2, Cleanup, Purge, Cookie Manager) stay locked until `ADMIN_PASSWORD` is set. There is no default password.

**3. Add your cookies**

```bash
mkdir -p data secrets
```

Then export and save your cookies as described in [Getting your Facebook cookies](#getting-your-facebook-cookies). You can do this after step 4 using the player's Cookie Manager.

**4. Start it**

```bash
docker compose up -d --build
```

Open `http://<server-ip>:3001`, log in, then press **Phase 1** and **Phase 2**.

<br>

## Getting your Facebook cookies

FBReelz logs in to Facebook with cookies copied from a browser where you are already logged in. No password is stored.

**1. Install a cookies.txt extension**

| Browser | Extension | Licence |
| --- | --- | --- |
| Firefox | [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) ([source](https://github.com/hrdl-github/cookies-txt)) | GPL-3.0 |
| Chrome / Edge | [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) ([source](https://github.com/kairi003/Get-cookies.txt-LOCALLY)) | MIT |

> [!WARNING]
> A cookie extension can read every login in your browser. Install only these open-source ones, from the store links above.

**2. Log in to [facebook.com](https://www.facebook.com)** in that browser and open any page, such as your Saved list.

**3. Export the cookies for facebook.com**

- **cookies.txt (Firefox):** click its toolbar icon. In the **current site** row, either copy to the clipboard or download (saves `cookies.txt`).
- **Get cookies.txt LOCALLY:** click its icon, leave the format on **Netscape**, then **Copy**, or **Export** (saves `www.facebook.com_cookies.txt`).

**4. Check it.** The text starts with `# Netscape HTTP Cookie File` and has tab-separated lines for `c_user` and `xs`. Those two are the login. Phase 1 warns if either is missing.

> [!TIP]
> Don't press **Log out** on Facebook in that browser afterwards. Logging out ends the session the cookies belong to. Closing the tab is fine.

<br>

### Saving them to FBReelz

**Option A: paste them into the player (easiest)**

1. Open the player and log in with your admin password.
2. Click 🍪 (Cookie Manager), paste the cookies, enter the admin password again and click **Update Cookies**.

The old file is kept as `secrets/cookies.txt.backup.<timestamp>`, and the new one is saved as `600` (owner only).

**Option B: copy the file to the server**

From PowerShell on your PC, after a download:

```powershell
scp $HOME\Downloads\cookies.txt <user>@<server-ip>:~/fbreelz/secrets/cookies.txt
```

Then on the server:

```bash
chmod 600 ~/fbreelz/secrets/cookies.txt
```

Delete the downloaded copy from your PC afterwards:

```powershell
Remove-Item $HOME\Downloads\cookies.txt
```

No restart is needed either way. Phase 1 reads the file each time it runs.

<br>

### When to refresh them

Export and save them again when:

- Phase 1 logs `Not logged in`, `Missing essential cookies` or `No video/reel links found`
- Facebook asks you to log in again in that browser
- you change your Facebook password or log out of all sessions

The Cookie Manager shows how many cookies are stored and when they were last updated. Phase 1 also lists expired cookies in `data/fbreelz_phase1.log`. A few expired ones are normal while `c_user` and `xs` are still valid.

<br>

## Using the player

| Control | What it does |
| --- | --- |
| Swipe / scroll | Next or previous video |
| **Mark** | Mark the current video as watched. Watched videos are dimmed and don't autoplay |
| **Phase 1** | Scrape your Saved list (up to 30 items) |
| **Phase 2** | Download anything new from the last Phase 1 run |
| **Cleanup** | Delete videos marked watched more than `RETENTION_DAYS` ago. They are not downloaded again |
| **Purge** | Delete every downloaded video. Cannot be undone |
| **Restart** | Restart the Node server inside the container |
| 🍪 | Cookie Manager: see cookie count and age, paste new cookies |
| ⓘ / 🎨 / ☀ | Info panel, colour scheme, light or dark |

Admin buttons ask for the password once. The login lasts until you log out or the container restarts.

<br>

## Environment variables

Set these in `.env`. Docker Compose reads it automatically.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | none | **Required.** Password for the admin controls |
| `FBREELZ_PORT` | `3001` | Host port for the player |
| `RETENTION_DAYS` | `3` | Days a watched video is kept before Cleanup deletes it |
| `PUSHOVER_USER_KEY` | none | Pushover user key. Leave blank to turn notifications off |
| `PUSHOVER_APP_TOKEN` | none | Pushover application token |
| `TZ` | `Europe/London` | Timezone for logs |

<br>

## Ports and paths

| Item | Where |
| --- | --- |
| Web player and API | host port `FBREELZ_PORT` (default `3001`), plain HTTP |
| Videos, `watched.json`, logs | `./data` → `/app/data` |
| `cookies.txt` | `./secrets` → `/app/secrets` |

`./data` and `./secrets` are bind mounts, so videos, watched marks and cookies survive `docker compose down` and rebuilds.

> [!TIP]
> To reach it from outside your LAN, put it behind a reverse proxy with TLS (Nginx Proxy Manager, Caddy) and point the proxy at port 3001.

<br>

## Command line

```bash
docker exec -it fbreelz python /app/scripts/fbreelz_phase1_playwright.py --max 30
docker exec -it fbreelz python /app/scripts/fbreelz_phase2_resolve.py --download
docker exec -it fbreelz python /app/tests/test_smoke.py
docker compose logs -f
```

Phase 2 also takes `--max N`, `--force` (download again), `--no-filter` (ignore cleaned list), `--no-pushover` and `--fallback-curl`. Logs are written to `data/fbreelz_phase1.log`, `data/fbreelz_phase2.log` and `data/backend.log`.

<br>

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Phase 1: `Not logged in` or `No video/reel links found` | Cookies have expired. [Export them again](#getting-your-facebook-cookies) and paste them into the Cookie Manager. `data/debug_playwright_saved.html` shows what Playwright saw |
| Phase 2 downloads fail | Facebook changes often. Bump `yt-dlp` in `requirements.txt` and run `docker compose up -d --build` |
| Admin login always says "Invalid password" | `ADMIN_PASSWORD` is empty or wasn't picked up. Set it in `.env`, then `docker compose up -d` |
| Admin buttons send you back to the login | The container restarted, which clears logins. Log in again |
| Container shows `unhealthy` | `docker compose logs fbreelz` and check `data/backend-error.log` |

<br>

## Security

> [!CAUTION]
> `cookies.txt` is a live login to your Facebook account. Anyone who can read it can act as you.

- Keep `secrets/cookies.txt` at `chmod 600`. The Cookie Manager writes it, and its backups, as `600`.
- Admin routes need a login. The password is compared in constant time and sessions are random tokens held in memory.
- The player serves plain HTTP. Keep it on your LAN, or put it behind a reverse proxy with TLS before exposing it.
- Only download content you have the right to keep, and for personal use.

<br>

## Repository layout

```text
.
├── Dockerfile                    # Python + Node + Chromium, supervisord
├── docker-compose.yml
├── .env.example                  # copy to .env
├── fbreelz_phase1_playwright.py  # scrape Saved list
├── fbreelz_phase2_resolve.py     # download with yt-dlp
├── cleaned_videos_filter.py      # skip videos already cleaned up
├── make_cache_playlist.py        # optional: M3U playlist for VLC
├── backend/                      # Node API + cleanup module
├── deploy/                       # server-wrapper.js, supervisord, entrypoint
├── web/                          # player (React, no build step)
└── tests/test_smoke.py
```

<br>

## Licence

No licence file yet. Personal project, provided as is.
