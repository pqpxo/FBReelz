/**
 * FBReelz Server Wrapper for Docker Deployment
 *
 * This wrapper extends the backend server with:
 * - Static file serving for the web frontend
 * - Environment-based path configuration
 * - Docker-compatible admin commands (runs scripts directly instead of docker exec)
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Environment-based configuration
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.FBREELZ_DATA_DIR || '/app/data';
const VIDEO_DIR = process.env.VIDEO_DIR || path.join(DATA_DIR, 'cache');
const WATCHED_FILE = process.env.WATCHED_FILE || path.join(DATA_DIR, 'watched.json');
const COOKIES_FILE = process.env.FBREELZ_COOKIES || '/app/secrets/cookies.txt';
const WEB_DIR = process.env.WEB_DIR || '/app/web';
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || '/app/scripts';

// Import cleanup module
const cleanup = require('./cleanup-watched');

// Admin password - CHANGE THIS!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for web frontend
app.use(express.static(WEB_DIR));

// Get list of all videos with metadata
app.get('/api/videos', async (req, res) => {
  try {
    // Ensure video directory exists
    try {
      await fs.access(VIDEO_DIR);
    } catch {
      await fs.mkdir(VIDEO_DIR, { recursive: true });
      return res.json({ success: true, videos: [] });
    }

    const files = await fs.readdir(VIDEO_DIR);
    const videoFiles = files.filter(file =>
      file.toLowerCase().endsWith('.mp4') ||
      file.toLowerCase().endsWith('.mkv') ||
      file.toLowerCase().endsWith('.webm')
    );

    const videos = await Promise.all(videoFiles.map(async (filename, index) => {
      const filepath = path.join(VIDEO_DIR, filename);
      const metapath = filepath.replace(/\.(mp4|mkv|webm)$/i, '.json');
      const stats = await fs.stat(filepath);

      let metadata = {
        title: filename.replace(/\.(mp4|mkv|webm)$/i, ''),
        description: ''
      };

      try {
        const metaContent = await fs.readFile(metapath, 'utf8');
        const metaData = JSON.parse(metaContent);
        metadata = {
          title: metaData.title || metadata.title,
          description: metaData.description || '',
          duration: metaData.duration || null,
          url: metaData.url || ''
        };
      } catch (e) {
        // No metadata file, use filename as title
      }

      return {
        id: index + 1,
        filename: filename,
        title: metadata.title,
        description: metadata.description,
        originalUrl: metadata.url,
        url: `/api/video/${encodeURIComponent(filename)}`,
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 200),
        size: stats.size,
        uploadDate: stats.mtime,
        duration: metadata.duration
      };
    }));

    res.json({ success: true, videos });
  } catch (error) {
    console.error('Error reading video directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load videos',
      message: error.message
    });
  }
});

// Stream individual video file
app.get('/api/video/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(VIDEO_DIR, filename);

    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(filepath);
    if (!normalizedPath.startsWith(VIDEO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.access(filepath);
    const stat = await fs.stat(filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const fileStream = require('fs').createReadStream(filepath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, head);
      require('fs').createReadStream(filepath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Video not found' });
    } else {
      res.status(500).json({ error: 'Failed to stream video' });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Get watched status
app.get('/api/watched', async (req, res) => {
  try {
    const data = await fs.readFile(WATCHED_FILE, 'utf8');
    res.json({ success: true, watched: JSON.parse(data) });
  } catch (error) {
    res.json({ success: true, watched: {} });
  }
});

// Save watched status
app.post('/api/watched', async (req, res) => {
  try {
    const { watched } = req.body;
    await fs.writeFile(WATCHED_FILE, JSON.stringify(watched, null, 2));
    res.json({ success: true, message: 'Watched status saved' });
  } catch (error) {
    console.error('Error saving watched status:', error);
    res.status(500).json({ success: false, error: 'Failed to save watched status' });
  }
});

// Cookie Management Endpoints

// Get cookies preview
app.get('/api/admin/cookies', async (req, res) => {
  try {
    const cookiesContent = await fs.readFile(COOKIES_FILE, 'utf8');
    const lines = cookiesContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    const cookieCount = lines.length;

    const preview = lines.slice(0, 3).map(line => {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        return {
          domain: parts[0],
          name: parts[5],
          hasValue: parts[6] ? 'yes' : 'no'
        };
      }
      return null;
    }).filter(Boolean);

    const stats = await fs.stat(COOKIES_FILE);

    res.json({
      success: true,
      cookieCount: cookieCount,
      lastModified: stats.mtime,
      preview: preview
    });

  } catch (error) {
    console.error('Error reading cookies:', error);

    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'Cookies file not found',
        message: 'No cookies.txt file exists yet'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to read cookies',
        message: error.message
      });
    }
  }
});

// Update cookies
app.post('/api/admin/cookies', async (req, res) => {
  try {
    const { cookies, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password'
      });
    }

    if (!cookies || typeof cookies !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid cookies data'
      });
    }

    // Create backup of existing cookies
    try {
      const existingCookies = await fs.readFile(COOKIES_FILE, 'utf8');
      const backupPath = COOKIES_FILE + '.backup.' + Date.now();
      await fs.writeFile(backupPath, existingCookies);
    } catch (backupError) {
      // If backup fails, it's okay
    }

    // Write new cookies
    await fs.writeFile(COOKIES_FILE, cookies, 'utf8');

    const lines = cookies.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    res.json({
      success: true,
      message: 'Cookies updated successfully',
      cookieCount: lines.length
    });

  } catch (error) {
    console.error('Error updating cookies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cookies',
      message: error.message
    });
  }
});

// Admin endpoints - Run scripts directly (Docker-compatible)
app.post('/api/admin/phase1', async (req, res) => {
  try {
    console.log('Starting Phase 1: Obtaining Facebook videos...');
    const scriptPath = path.join(SCRIPTS_DIR, 'fbreelz_phase1_playwright.py');
    const { stdout, stderr } = await execPromise(
      `python ${scriptPath} --max 30`,
      {
        timeout: 300000,
        env: { ...process.env, FBREELZ_DATA_DIR: DATA_DIR, FBREELZ_COOKIES: COOKIES_FILE }
      }
    );

    console.log('Phase 1 stdout:', stdout);
    if (stderr) console.log('Phase 1 stderr:', stderr);

    res.json({
      success: true,
      message: 'Phase 1 completed: Videos obtained',
      output: stdout
    });
  } catch (error) {
    console.error('Phase 1 error:', error);
    res.status(500).json({
      success: false,
      error: 'Phase 1 failed',
      message: error.message
    });
  }
});

app.post('/api/admin/phase2', async (req, res) => {
  try {
    console.log('Starting Phase 2: Downloading videos...');
    const scriptPath = path.join(SCRIPTS_DIR, 'fbreelz_phase2_resolve.py');
    const { stdout, stderr } = await execPromise(
      `python ${scriptPath} --download`,
      {
        timeout: 600000,
        env: { ...process.env, FBREELZ_DATA_DIR: DATA_DIR, FBREELZ_COOKIES: COOKIES_FILE }
      }
    );

    console.log('Phase 2 stdout:', stdout);
    if (stderr) console.log('Phase 2 stderr:', stderr);

    res.json({
      success: true,
      message: 'Phase 2 completed: Videos downloaded',
      output: stdout
    });
  } catch (error) {
    console.error('Phase 2 error:', error);
    res.status(500).json({
      success: false,
      error: 'Phase 2 failed',
      message: error.message
    });
  }
});

app.post('/api/admin/purge', async (req, res) => {
  try {
    console.log('Starting purge: Deleting all videos and data...');

    // Delete cache files
    await execPromise(`rm -rf ${VIDEO_DIR}/*`);

    // Delete resolved items
    await execPromise(`rm -f ${DATA_DIR}/resolved_items.json`);

    // Delete M3U files
    await execPromise(`rm -f ${DATA_DIR}/fbreelz_cache*.m3u`);

    console.log('Purge completed');

    res.json({
      success: true,
      message: 'Purge completed: All videos and data deleted'
    });
  } catch (error) {
    console.error('Purge error:', error);
    res.status(500).json({
      success: false,
      error: 'Purge failed',
      message: error.message
    });
  }
});

// Restart backend - In Docker, we use supervisorctl
app.post('/api/admin/restart-backend', async (req, res) => {
  try {
    console.log('Backend restart requested...');

    res.json({
      success: true,
      message: 'Backend service restarting...'
    });

    res.end();

    setTimeout(() => {
      console.log('Executing restart now...');
      exec('supervisorctl restart backend', (error, stdout, stderr) => {
        if (error) {
          console.error('Restart error:', error);
        } else {
          console.log('Restart command executed');
        }
      });
    }, 500);

  } catch (error) {
    console.error('Restart backend error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Backend restart failed',
        message: error.message
      });
    }
  }
});

// Reload NGINX - may not be available in Docker
app.post('/api/admin/reload-nginx', async (req, res) => {
  try {
    console.log('NGINX reload requested (may not be available in Docker)...');
    res.json({
      success: true,
      message: 'NGINX reload not applicable in Docker container'
    });
  } catch (error) {
    console.error('Reload NGINX error:', error);
    res.status(500).json({
      success: false,
      error: 'NGINX reload failed',
      message: error.message
    });
  }
});

// Cleanup old watched videos
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    console.log('Starting cleanup of old watched videos...');

    // Set environment variables for cleanup module
    process.env.VIDEO_DIR = VIDEO_DIR;
    process.env.WATCHED_FILE = WATCHED_FILE;

    const result = await cleanup();

    if (result.success) {
      console.log(`Cleanup completed: ${result.message}`);
      res.json(result);
    } else {
      console.error(`Cleanup failed: ${result.error}`);
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FBReelz server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving videos from: ${VIDEO_DIR}`);
  console.log(`Serving web from: ${WEB_DIR}`);
  console.log(`Cookies file: ${COOKIES_FILE}`);
  console.log(`Scripts directory: ${SCRIPTS_DIR}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
