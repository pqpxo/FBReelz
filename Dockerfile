# ## version 2
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && python -m playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Scripts
COPY scripts/fbreelz_phase1_playwright.py /app/fbreelz_phase1_graphql.py
COPY scripts/fbreelz_phase2_resolve.py /app/fbreelz_phase2_resolve.py

# Run as the usual first host user so files in ./data stay owned by you
RUN useradd --uid 1000 --create-home fbreelz
USER fbreelz

# Container is a toolbox; run scripts via docker exec
CMD ["sleep", "infinity"]
