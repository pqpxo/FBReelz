# FBReelz Docker Deployment Package

Self-contained Docker package for deploying FBReelz on remote hosts.

## Quick Start

1. **Copy this entire directory to your remote host**

2. **Add your Facebook cookies**
   ```bash
   # Create cookies file in Netscape format
   nano secrets/cookies.txt
   ```

3. **Build and start the container**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Web UI: `http://your-host:3001`
   - API: `http://your-host:3001/api/`

## Directory Structure

```
fbreelz_docker/
├── Dockerfile              # Container build instructions
├── docker-compose.yml      # Deployment configuration
├── requirements.txt        # Python dependencies
├── backend/                # Node.js API server
├── web/                    # Frontend web application
├── deploy/                 # Deployment configs (supervisord, entrypoint)
├── *.py                    # Python scraping scripts
├── data/                   # Persistent data (videos, state) - mounted volume
│   └── cache/              # Downloaded videos
└── secrets/                # Sensitive files - mounted volume
    └── cookies.txt         # Facebook cookies (you must create this)
```

## Configuration

### Environment Variables

Set in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `ADMIN_PASSWORD` | `admin123` | Admin panel password (CHANGE THIS!) |
| `FBREELZ_DATA_DIR` | `/app/data` | Data directory inside container |
| `FBREELZ_COOKIES` | `/app/secrets/cookies.txt` | Cookies file path |

### Changing Admin Password

Edit `docker-compose.yml` and uncomment/modify the `ADMIN_PASSWORD` line:
```yaml
environment:
  - ADMIN_PASSWORD=your_secure_password
```

Then restart: `docker-compose up -d`

## Management Commands

```bash
# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Stop container
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Execute commands inside container
docker exec -it fbreelz bash

# Run Phase 1 manually
docker exec -it fbreelz python /app/scripts/fbreelz_phase1_playwright.py --max 30

# Run Phase 2 manually
docker exec -it fbreelz python /app/scripts/fbreelz_phase2_resolve.py --download
```

## Cookies Format

The `secrets/cookies.txt` file must be in Netscape cookie format. You can export cookies from your browser using extensions like "Get cookies.txt" or "EditThisCookie".

Required cookies for Facebook: `c_user`, `xs`, `datr`, `fr`

## Reverse Proxy (Optional)

To serve behind nginx with HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs fbreelz
```

**Phase 1 fails (cookies issue):**
- Verify cookies.txt exists and is readable
- Re-export fresh cookies from browser
- Check cookies contain `c_user` and `xs`

**No videos appearing:**
- Run Phase 1 first (scrape), then Phase 2 (download)
- Check `data/fbreelz_phase1.log` and `data/fbreelz_phase2.log`

**Health check failing:**
```bash
docker exec -it fbreelz curl http://localhost:3001/api/health
```
