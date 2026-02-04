#!/bin/bash

# FB Reelz Package Creator
# This script creates all necessary files and packages them into a zip

echo "Creating FB Reelz package..."

# Create temporary directory
mkdir -p fbreelz-package
cd fbreelz-package

# Create frontend directory
mkdir -p frontend

# Create index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FB Reels Clone</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
        }
        #root {
            height: 100vh;
            width: 100vw;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" src="app.js"></script>
</body>
</html>
EOF

# Create app.js
cat > frontend/app.js << 'EOF'
const { useState, useRef, useEffect } = React;

// Lucide React Icons as inline SVG components
const ChevronUp = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

const ChevronDown = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const Play = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const Pause = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
);

const Volume2 = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

const VolumeX = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);

const Heart = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const MessageCircle = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const Share2 = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);

function FBReelsClone() {
    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [liked, setLiked] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);

    const API_BASE_URL = window.location.origin;

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/videos`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.videos.length > 0) {
                const videosWithFullUrls = data.videos.map(video => ({
                    ...video,
                    url: `${API_BASE_URL}${video.url}`
                }));
                setVideos(videosWithFullUrls);
                setLoading(false);
            } else {
                setError('No videos found in directory');
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to load videos:', err);
            setError(`Failed to connect to server: ${err.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.log('Play error:', e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentIndex]);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        const diff = touchStartY.current - touchEndY.current;
        const threshold = 50;

        if (diff > threshold && currentIndex < videos.length - 1) {
            navigateVideo('down');
        } else if (diff < -threshold && currentIndex > 0) {
            navigateVideo('up');
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY > 0 && currentIndex < videos.length - 1) {
            navigateVideo('down');
        } else if (e.deltaY < 0 && currentIndex > 0) {
            navigateVideo('up');
        }
    };

    const navigateVideo = (direction) => {
        if (direction === 'down' && currentIndex < videos.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsPlaying(true);
        } else if (direction === 'up' && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const toggleLike = () => {
        setLiked(prev => ({
            ...prev,
            [currentIndex]: !prev[currentIndex]
        }));
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center" style={{backgroundColor: '#2b374e'}}>
                <div className="text-white text-center">
                    <div className="text-xl mb-4">Loading videos...</div>
                    <div className="text-sm text-gray-400">Connecting to server</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center p-8" style={{backgroundColor: '#2b374e'}}>
                <div className="text-red-500 text-xl mb-4">Error</div>
                <div className="text-white text-center mb-4">{error}</div>
                <button 
                    onClick={loadVideos}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
                <div className="text-gray-400 text-sm mt-8 text-center max-w-md">
                    <p>Make sure:</p>
                    <p>1. Backend server is running</p>
                    <p>2. Videos exist in /opt/fbreelz/data/cache</p>
                    <p>3. NGINX is configured correctly</p>
                </div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="h-screen w-full flex items-center justify-center" style={{backgroundColor: '#2b374e'}}>
                <div className="text-white text-center">
                    <div className="text-xl">No videos found</div>
                    <div className="text-sm text-gray-400 mt-2">Add MP4 files to /opt/fbreelz/data/cache</div>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="relative h-screen w-full overflow-hidden"
            style={{backgroundColor: '#2b374e'}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >
            <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    key={videos[currentIndex]?.id}
                    src={videos[currentIndex]?.url}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    muted={isMuted}
                    autoPlay
                    onEnded={() => {
                        if (currentIndex < videos.length - 1) {
                            navigateVideo('down');
                        }
                    }}
                />
            </div>

            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                <div className="flex items-center justify-between text-white">
                    <div className="text-lg font-semibold">Reels</div>
                    <div className="text-sm">{currentIndex + 1} / {videos.length}</div>
                </div>
            </div>

            <div className="absolute bottom-32 left-4 right-20 z-10 text-white">
                <div className="text-sm font-medium truncate">{videos[currentIndex]?.filename}</div>
            </div>

            <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                <button 
                    onClick={toggleLike}
                    className="flex flex-col items-center gap-1"
                >
                    <Heart 
                        className={`w-7 h-7 ${liked[currentIndex] ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                    <span className="text-white text-xs">
                        {videos[currentIndex]?.likes + (liked[currentIndex] ? 1 : 0)}
                    </span>
                </button>
                
                <button className="flex flex-col items-center gap-1">
                    <MessageCircle className="w-7 h-7 text-white" />
                    <span className="text-white text-xs">{videos[currentIndex]?.comments}</span>
                </button>
                
                <button className="flex flex-col items-center gap-1">
                    <Share2 className="w-7 h-7 text-white" />
                    <span className="text-white text-xs">{videos[currentIndex]?.shares}</span>
                </button>
            </div>

            <div className="absolute bottom-8 left-4 flex gap-4 z-10">
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                    ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                    )}
                </button>
                
                <button
                    onClick={toggleMute}
                    className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
                >
                    {isMuted ? (
                        <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                        <Volume2 className="w-6 h-6 text-white" />
                    )}
                </button>
            </div>

            {currentIndex === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none z-20 opacity-50">
                    <p className="text-sm">Swipe up/down or scroll to navigate</p>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FBReelsClone />);
EOF

# Create backend directory
mkdir -p backend

# Create server.js
cat > backend/server.js << 'EOF'
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const VIDEO_DIR = '/opt/fbreelz/data/cache';

app.use(cors());
app.use(express.json());

app.get('/api/videos', async (req, res) => {
  try {
    const files = await fs.readdir(VIDEO_DIR);
    const videoFiles = files.filter(file => 
      file.toLowerCase().endsWith('.mp4')
    );

    const videos = videoFiles.map((filename, index) => ({
      id: index + 1,
      filename: filename,
      url: `/api/video/${encodeURIComponent(filename)}`,
      likes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 200)
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

app.get('/api/video/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(VIDEO_DIR, filename);

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Video server running on http://localhost:${PORT}`);
  console.log(`Serving videos from: ${VIDEO_DIR}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
EOF

# Create package.json for backend
cat > backend/package.json << 'EOF'
{
  "name": "fbreelz-backend",
  "version": "1.0.0",
  "description": "FB Reelz Video API Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Create nginx config
cat > nginx-fbreelz.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/fbreelz;
    index index.html;

    access_log /var/log/nginx/fbreelz_access.log;
    error_log /var/log/nginx/fbreelz_error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
EOF

# Create systemd service file
cat > fbreelz-api.service << 'EOF'
[Unit]
Description=FB Reelz Video API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/fbreelz-server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create installation script
cat > install.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "FB Reelz Installation Script"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
apt update
apt install -y nginx nodejs npm

# Create directories
echo "Creating directories..."
mkdir -p /var/www/fbreelz
mkdir -p /opt/fbreelz-server
mkdir -p /opt/fbreelz/data/cache

# Copy frontend files
echo "Installing frontend..."
cp frontend/index.html /var/www/fbreelz/
cp frontend/app.js /var/www/fbreelz/

# Copy backend files
echo "Installing backend..."
cp backend/server.js /opt/fbreelz-server/
cp backend/package.json /opt/fbreelz-server/

# Install backend dependencies
echo "Installing backend dependencies..."
cd /opt/fbreelz-server
npm install

# Setup NGINX
echo "Configuring NGINX..."
cp ../nginx-fbreelz.conf /etc/nginx/sites-available/fbreelz
ln -sf /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/

# Setup systemd service
echo "Configuring systemd service..."
cp ../fbreelz-api.service /etc/systemd/system/

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/fbreelz
chown -R www-data:www-data /opt/fbreelz
chmod -R 755 /var/www/fbreelz
chmod -R 755 /opt/fbreelz

# Enable and start services
echo "Starting services..."
systemctl daemon-reload
systemctl enable fbreelz-api
systemctl start fbreelz-api
nginx -t && systemctl reload nginx

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Add your MP4 videos to: /opt/fbreelz/data/cache/"
echo "2. Update server_name in: /etc/nginx/sites-available/fbreelz"
echo "3. Access your site at: http://your-server-ip"
echo ""
echo "Service management:"
echo "  - Check API status: systemctl status fbreelz-api"
echo "  - Check NGINX status: systemctl status nginx"
echo "  - View API logs: journalctl -u fbreelz-api -f"
echo ""
EOF

chmod +x install.sh

# Create README
cat > README.md << 'EOF'
# FB Reelz - Video Scrolling Web App

A Facebook Reels-style video scrolling interface with vertical navigation.

## Quick Install

Run as root:

```bash
sudo ./install.sh
```

## Manual Installation

### 1. Install Dependencies
```bash
sudo apt update
sudo apt install nginx nodejs npm
```

### 2. Setup Frontend
```bash
sudo mkdir -p /var/www/fbreelz
sudo cp frontend/index.html /var/www/fbreelz/
sudo cp frontend/app.js /var/www/fbreelz/
```

### 3. Setup Backend
```bash
sudo mkdir -p /opt/fbreelz-server
sudo cp backend/server.js /opt/fbreelz-server/
sudo cp backend/package.json /opt/fbreelz-server/
cd /opt/fbreelz-server
sudo npm install
```

### 4. Setup Video Directory
```bash
sudo mkdir -p /opt/fbreelz/data/cache
# Copy your MP4 files here
```

### 5. Configure NGINX
```bash
sudo cp nginx-fbreelz.conf /etc/nginx/sites-available/fbreelz
sudo ln -s /etc/nginx/sites-available/fbreelz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup Backend Service
```bash
sudo cp fbreelz-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fbreelz-api
sudo systemctl start fbreelz-api
```

## Features

- Vertical video scrolling (swipe/scroll)
- Click to play/pause
- Mute/unmute controls
- Like, comment, share buttons
- Mobile and desktop support
- Auto-play with loop

## File Structure

```
fbreelz-package/
├── frontend/
│   ├── index.html
│   └── app.js
├── backend/
│   ├── server.js
│   └── package.json
├── nginx-fbreelz.conf
├── fbreelz-api.service
├── install.sh
└── README.md
```

## Configuration

### Change Video Directory
Edit `/opt/fbreelz-server/server.js`:
```javascript
const VIDEO_DIR = '/your/custom/path';
```

### Change API Port
Edit `/opt/fbreelz-server/server.js`:
```javascript
const PORT = 8080; // Your desired port
```

Then update NGINX config accordingly.

## Troubleshooting

### Check Services
```bash
sudo systemctl status fbreelz-api
sudo systemctl status nginx
```

### View Logs
```bash
sudo journalctl -u fbreelz-api -f
sudo tail -f /var/log/nginx/fbreelz_error.log
```

### Test API
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/videos
```

## License

MIT
EOF

cd ..

# Create the zip file
echo "Creating zip file..."
zip -r fbreelz-package.zip fbreelz-package/

# Cleanup
rm -rf fbreelz-package

echo ""
echo "========================================="
echo "Package created successfully!"
echo "========================================="
echo ""
echo "File: fbreelz-package.zip"
echo ""
echo "To install:"
echo "1. Extract the zip file"
echo "2. Run: sudo ./install.sh"
echo "3. Add your videos to /opt/fbreelz/data/cache/"
echo ""
