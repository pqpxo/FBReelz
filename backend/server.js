const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const cleanup = require('./cleanup-watched');

const execPromise = util.promisify(exec);

const app = express();
const PORT = 3001;
const VIDEO_DIR = '/opt/fbreelz/data/cache';
const WATCHED_FILE = '/opt/fbreelz/data/watched.json';
const COOKIES_FILE = '/opt/fbreelz/secrets/cookies.txt';

// Admin password - CHANGE THIS!
const ADMIN_PASSWORD = 'admin123';

// Middleware
app.use(cors());
app.use(express.json());

// Get list of all videos with metadata
app.get('/api/videos', async (req, res) => {
  try {
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

      // Load metadata if exists
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

    // Check if file exists
    await fs.access(filepath);
    const stat = await fs.stat(filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video seeking
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
      // Send entire file
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
    // File doesn't exist yet, return empty object
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
    console.log('Reading cookies file for preview...');
    
    // Read the cookies file
    const cookiesContent = await fs.readFile(COOKIES_FILE, 'utf8');
    const lines = cookiesContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    // Parse cookies to count them
    const cookieCount = lines.length;
    
    // Get first 3 lines as preview (non-sensitive)
    const preview = lines.slice(0, 3).map(line => {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        return {
          domain: parts[0],
          name: parts[5],
          // Don't show actual value for security
          hasValue: parts[6] ? 'yes' : 'no'
        };
      }
      return null;
    }).filter(Boolean);
    
    // Get file modification time
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
    
    // Verify admin password
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
    
    console.log('Updating cookies file...');
    
    // Create backup of existing cookies
    try {
      const existingCookies = await fs.readFile(COOKIES_FILE, 'utf8');
      const backupPath = COOKIES_FILE + '.backup.' + Date.now();
      await fs.writeFile(backupPath, existingCookies);
      console.log(`Backup created: ${backupPath}`);
    } catch (backupError) {
      // If backup fails, it's okay - might not exist yet
      console.log('No existing cookies to backup (this is fine for first time)');
    }
    
    // Write new cookies
    await fs.writeFile(COOKIES_FILE, cookies, 'utf8');
    
    // Set correct permissions
    await execPromise(`chmod 600 ${COOKIES_FILE}`);
    
    console.log('Cookies updated successfully');
    
    // Count new cookies
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

// Admin endpoints
app.post('/api/admin/phase1', async (req, res) => {
  try {
    console.log('Starting Phase 1: Obtaining Facebook videos...');
    const { stdout, stderr } = await execPromise(
      'docker exec -t fbreelz python /app/fbreelz_phase1_playwright.py --max 30',
      { timeout: 300000 } // 5 minute timeout
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
    
    // Call the new Phase 2 script with --download flag
    const { stdout, stderr } = await execPromise(
      'docker exec -t fbreelz python /app/fbreelz_phase2_resolve.py --download',
      { timeout: 600000 } // 10 minute timeout
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
    await execPromise('rm -rf /opt/fbreelz/data/cache/*');

    // Delete resolved items
    await execPromise('rm -f /opt/fbreelz/data/resolved_items.json');

    // Delete M3U files
    await execPromise('rm -f /opt/fbreelz/data/fbreelz_cache*.m3u');

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

app.post('/api/admin/restart-backend', async (req, res) => {
  try {
    console.log('Backend restart requested...');

    // Send response immediately BEFORE restarting
    res.json({
      success: true,
      message: 'Backend service restarting...'
    });

    // Close the response
    res.end();

    // Wait a moment for response to be sent
    setTimeout(() => {
      console.log('Executing restart now...');
      exec('sudo systemctl restart fbreelz-api', (error, stdout, stderr) => {
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

app.post('/api/admin/reload-nginx', async (req, res) => {
  try {
    console.log('Reloading NGINX...');

    // Use sudo to reload nginx
    await execPromise('sudo systemctl reload nginx');

    console.log('NGINX reloaded');

    // Return simple success response
    res.json({
      success: true,
      message: 'NGINX reloaded successfully'
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

app.listen(PORT, () => {
  console.log(`Video server running on http://localhost:${PORT}`);
  console.log(`Serving videos from: ${VIDEO_DIR}`);
  console.log(`Cookies file: ${COOKIES_FILE}`);
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
