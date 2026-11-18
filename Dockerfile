# FBReelz Deployment Dockerfile
# Self-contained image with Python, Node.js, and all application code
# Suitable for deployment on remote hosts
#
# Build:
#   docker build -t fbreelz:latest .
#
# Run:
#   docker-compose up -d

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_VERSION=20

# Application environment variables
ENV FBREELZ_DATA_DIR=/app/data
ENV FBREELZ_COOKIES=/app/secrets/cookies.txt
ENV VIDEO_DIR=/app/data/cache
ENV WATCHED_FILE=/app/data/watched.json
ENV PORT=3001

WORKDIR /app

# Install system dependencies including Playwright/Chromium requirements and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Basic utilities
    ca-certificates \
    curl \
    gnupg \
    # FFmpeg for yt-dlp video processing
    ffmpeg \
    # Supervisor for process management
    supervisor \
    # Playwright/Chromium core dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    # Additional dependencies for stability
    fonts-liberation \
    fonts-noto-color-emoji \
    libappindicator3-1 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Install Playwright Chromium browser
RUN python -m playwright install chromium

# Copy backend and install Node.js dependencies
COPY backend/package*.json /app/backend/
RUN cd /app/backend && npm install --production

# Copy all application code
COPY backend/ /app/backend/
COPY web/ /app/web/

# Copy Python scripts
COPY fbreelz_phase1_playwright.py /app/scripts/
COPY fbreelz_phase2_resolve.py /app/scripts/
COPY make_cache_playlist.py /app/scripts/
COPY cleaned_videos_filter.py /app/scripts/

# Copy deployment configurations
COPY deploy/supervisord.conf /etc/supervisor/conf.d/fbreelz.conf
COPY deploy/entrypoint.sh /app/entrypoint.sh
COPY deploy/server-wrapper.js /app/backend/server-wrapper.js

RUN chmod +x /app/entrypoint.sh

# Create data directories
RUN mkdir -p /app/data/cache /app/secrets

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start with entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/fbreelz.conf"]
