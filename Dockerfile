# ## version 1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Scripts
COPY scripts/fbreelz_phase1_playwright.py /app/fbreelz_phase1_graphql.py
COPY scripts/fbreelz_phase2_resolve.py /app/fbreelz_phase2_resolve.py

# Default command: sleep (container is a toolbox; run scripts via docker exec)
CMD ["bash","-lc","sleep infinity"]
