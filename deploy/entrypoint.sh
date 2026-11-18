#!/bin/bash
set -e

# FBReelz Docker Entrypoint
# Creates necessary directories and starts services

echo "=== FBReelz Container Starting ==="

# Create data directories if they don't exist
mkdir -p /app/data/cache
mkdir -p /var/log/supervisor

# Ensure proper permissions
chmod -R 755 /app/data 2>/dev/null || true

# Check if cookies file exists
if [ -f "/app/secrets/cookies.txt" ]; then
    echo "Cookies file found"
else
    echo "WARNING: No cookies.txt found in /app/secrets/"
    echo "You'll need to add cookies via the admin interface or mount a cookies file"
fi

# Show environment info
echo "Data directory: ${FBREELZ_DATA_DIR:-/app/data}"
echo "Cookies file: ${FBREELZ_COOKIES:-/app/secrets/cookies.txt}"
echo "Backend port: ${PORT:-3001}"

echo "=== Starting Services ==="

# Execute the CMD
exec "$@"
