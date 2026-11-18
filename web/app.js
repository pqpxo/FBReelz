const { useState, useRef, useEffect } = React;

// Icon Components
const Play = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const Pause = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const Volume2 = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);
const VolumeX = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);
const Eye = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOff = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);
const Download = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const Search = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
);
const Trash = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const RefreshCw = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const Server = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
);
const Sun = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);
const Moon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);
const Palette = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
);
const Lock = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const Info = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
const X = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const Cookie = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="16" cy="8" r="1"></circle><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="16" r="1"></circle><circle cx="8" cy="8" r="1"></circle></svg>
);
const Broom = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10M12 12l-4 8h8l-4-8z"></path><path d="M8 20h8"></path></svg>
);

const colorSchemes = {
    classic: { bg: '#2b374e', name: 'Classic' },
    dark: { bg: '#1a1a1a', name: 'Dark' },
    purple: { bg: '#2d1b3d', name: 'Purple' },
    green: { bg: '#1a2f23', name: 'Green' },
    red: { bg: '#2f1b1b', name: 'Red' },
    blue: { bg: '#1b2838', name: 'Blue' }
};

function FBReelsClone() {
    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [watched, setWatched] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [theme, setTheme] = useState('dark');
    const [colorScheme, setColorScheme] = useState('classic');
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    
    // Cookie management states
    const [showCookieDialog, setShowCookieDialog] = useState(false);
    const [cookieInput, setCookieInput] = useState('');
    const [cookiePassword, setCookiePassword] = useState('');
    const [cookieInfo, setCookieInfo] = useState(null);
    const [cookieLoading, setCookieLoading] = useState(false);

    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const API_BASE_URL = window.location.origin;
    const currentBg = theme === 'light' ? '#f0f0f0' : colorSchemes[colorScheme].bg;
    const currentText = theme === 'light' ? '#000000' : '#ffffff';

    useEffect(() => {
        loadVideos();
        loadWatchedStatus();
        loadAuthStatus();
        loadThemeSettings();

        // Show login dialog on first load if not authenticated
        setTimeout(() => {
            if (!isAuthenticated) {
                setShowLogin(true);
            }
        }, 1000);
    }, []);

    const loadAuthStatus = async () => {
        try {
            const result = await window.storage.get('admin-authenticated');
            if (result && result.value === 'true') setIsAuthenticated(true);
        } catch (e) {}
    };

    const loadThemeSettings = async () => {
        try {
            const t = await window.storage.get('theme');
            if (t && t.value) setTheme(t.value);
            const c = await window.storage.get('colorScheme');
            if (c && c.value) setColorScheme(c.value);
        } catch (e) {}
    };

    const handleLogin = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (data.success) {
                setIsAuthenticated(true);
                setShowLogin(false);
                setPassword('');
                setLoginError('');
                await window.storage.set('admin-authenticated', 'true');
                addNotification('✓ Logged in', 'success');
            } else {
                setLoginError('Invalid password');
            }
        } catch (e) {
            setLoginError('Login failed');
        }
    };

    const handleLogout = async () => {
        setIsAuthenticated(false);
        await window.storage.set('admin-authenticated', 'false');
        addNotification('Logged out', 'info');
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        await window.storage.set('theme', newTheme);
    };

    const changeColorScheme = async (scheme) => {
        setColorScheme(scheme);
        await window.storage.set('colorScheme', scheme);
        setShowColorMenu(false);
    };

    // Cookie management functions
    const loadCookieInfo = async () => {
        try {
            setCookieLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/cookies`);
            const data = await response.json();
            
            if (data.success) {
                setCookieInfo(data);
            } else {
                setCookieInfo(null);
            }
        } catch (e) {
            console.error('Failed to load cookie info:', e);
            setCookieInfo(null);
        } finally {
            setCookieLoading(false);
        }
    };

    const handleCookieDialogOpen = async () => {
        if (!isAuthenticated) {
            setShowLogin(true);
            return;
        }
        setShowCookieDialog(true);
        setCookieInput('');
        setCookiePassword('');
        await loadCookieInfo();
    };

    const handleCookieUpdate = async () => {
        if (!cookieInput.trim()) {
            addNotification('Please paste cookies', 'error');
            return;
        }

        if (!cookiePassword) {
            addNotification('Password required', 'error');
            return;
        }

        try {
            setCookieLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/cookies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cookies: cookieInput,
                    password: cookiePassword
                })
            });

            const data = await response.json();

            if (data.success) {
                addNotification(`✓ Cookies updated (${data.cookieCount} cookies)`, 'success');
                setShowCookieDialog(false);
                setCookieInput('');
                setCookiePassword('');
            } else {
                addNotification(`✗ ${data.error}`, 'error');
            }
        } catch (e) {
            addNotification(`✗ Failed to update cookies: ${e.message}`, 'error');
        } finally {
            setCookieLoading(false);
        }
    };

    const loadVideos = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/videos`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.videos.length > 0) {
                setVideos(data.videos.map(v => ({...v, url: `${API_BASE_URL}${v.url}`})));
                setLoading(false);
            } else {
                // No videos found - set empty array to trigger empty state UI
                setVideos([]);
                setLoading(false);
            }
        } catch (err) {
            setError(`Failed to connect: ${err.message}`);
            setLoading(false);
        }
    };

    const loadWatchedStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/watched`);
            const data = await response.json();
            if (data.success) {
                setWatched(data.watched);
            }
        } catch (e) {
            console.log('No watched status found');
        }
    };

    const saveWatchedStatus = async (newWatched) => {
        try {
            await fetch(`${API_BASE_URL}/api/watched`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ watched: newWatched })
            });
        } catch (e) {
            console.error('Failed to save watched status:', e);
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            const currentVideo = videos[currentIndex];
            const isWatched = currentVideo && watched[currentVideo.id];

            if (showLogin || showConfirmDialog || adminLoading || showCookieDialog) {
                videoRef.current.pause();
            } else if (isWatched) {
                // Don't auto-play watched videos
                videoRef.current.pause();
                setIsPlaying(false);
            } else if (isPlaying) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentIndex, showLogin, showConfirmDialog, adminLoading, showCookieDialog, watched, videos]);

    const handleTouchStart = (e) => {
        if (showLogin || showConfirmDialog || showCookieDialog) return;
        containerRef.current.touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (showLogin || showConfirmDialog || showCookieDialog) return;
        const diff = containerRef.current.touchStartY - e.changedTouches[0].clientY;
        if (diff > 50 && currentIndex < videos.length - 1) setCurrentIndex(i => i + 1);
        else if (diff < -50 && currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    const handleWheel = (e) => {
        if (showLogin || showConfirmDialog || showCookieDialog) return;
        e.preventDefault();
        if (e.deltaY > 0 && currentIndex < videos.length - 1) setCurrentIndex(i => i + 1);
        else if (e.deltaY < 0 && currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    const togglePlay = () => {
        if (showLogin || showConfirmDialog || showCookieDialog) return;
        setIsPlaying(!isPlaying);
    };
    const toggleMute = () => setIsMuted(!isMuted);

    const toggleWatched = () => {
        const videoId = videos[currentIndex]?.id;
        if (!videoId) return;
        
        // Toggle with timestamp
        const newWatched = {...watched};
        if (watched[videoId]) {
            // Unmark as watched
            delete newWatched[videoId];
        } else {
            // Mark as watched with timestamp
            newWatched[videoId] = {
                timestamp: new Date().toISOString(),
                marked: true
            };
        }
        
        setWatched(newWatched);
        saveWatchedStatus(newWatched);
    };

    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    };

    const getActionDetails = (action) => ({
        'phase1': { title: 'Run Phase 1', message: 'Scrape Facebook for videos (max 30). May take several minutes.', confirmText: 'Start Phase 1', startMessage: 'Phase 1 started...' },
        'phase2': { title: 'Run Phase 2', message: 'Download all videos from Phase 1. May take 10+ minutes.', confirmText: 'Start Phase 2', startMessage: 'Phase 2 started...' },
        'purge': { title: 'Purge All Data', message: 'WARNING: Permanently delete all videos and data. Cannot be undone!', confirmText: 'Delete Everything', startMessage: 'Purging data...' },
        'cleanup': { title: 'Cleanup Old Videos', message: 'Delete videos marked as watched for more than 3 days. This cannot be undone!', confirmText: 'Clean Up', startMessage: 'Cleaning up old videos...' },
        'restart-backend': { title: 'Restart Backend', message: 'Restart API service. May be temporarily unavailable.', confirmText: 'Restart', startMessage: 'Restarting...' },
        'reload-nginx': { title: 'Reload NGINX', message: 'Reload web server. No downtime expected.', confirmText: 'Reload', startMessage: 'Reloading NGINX...' }
    }[action]);

    const handleAdminButtonClick = (action) => {
        if (!isAuthenticated) {
            setShowLogin(true);
            return;
        }
        setConfirmAction(action);
        setShowConfirmDialog(true);
    };

    const runAdminAction = async (action) => {
        setAdminLoading(true);
        setShowConfirmDialog(false);
        addNotification(getActionDetails(action).startMessage, 'info');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/${action}`, { method: 'POST' });
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.success) {
                // Special handling for cleanup to show detailed message
                if (action === 'cleanup' && data.deletedCount !== undefined) {
                    addNotification(`✓ Cleanup: ${data.deletedCount} videos deleted (${(data.deletedSize / (1024 * 1024)).toFixed(1)} MB freed)`, 'success');
                } else {
                    addNotification(`✓ ${data.message}`, 'success');
                }
                // Reload videos after phase2, purge, or cleanup
                if (action === 'phase2' || action === 'purge' || action === 'cleanup') {
                    setTimeout(loadVideos, 2000);
                }
            } else {
                addNotification(`✗ ${data.error}`, 'error');
            }
        } catch (err) {
            addNotification(`✗ ${err.message}`, 'error');
        } finally {
            setAdminLoading(false);
            setConfirmAction(null);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center animate-pulse" style={{backgroundColor: currentBg}}>
                <div className="text-center" style={{color: currentText}}>
                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4"></div>
                    <div>Loading videos...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div ref={containerRef} className="relative h-screen w-full overflow-hidden" style={{backgroundColor: currentBg}}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                    <div className="flex items-center justify-between text-white">
                        <div className="text-lg font-semibold">SWAKES Reels</div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleCookieDialogOpen} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Manage Cookies">
                                <Cookie className="w-5 h-5 text-yellow-400" />
                            </button>
                            <button onClick={toggleTheme} className="p-2">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                            {isAuthenticated ? <button onClick={handleLogout} className="text-sm px-3 py-1 bg-red-500/80 rounded">Logout</button> : <button onClick={() => setShowLogin(true)} className="p-2"><Lock className="w-5 h-5" /></button>}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center" style={{color: currentText}}>
                        <div className="text-6xl mb-4">⚠️</div>
                        <div className="text-2xl font-semibold mb-2 text-red-500">Error Loading Videos</div>
                        <div className="text-gray-400 mb-6">{error}</div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={loadVideos} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white">
                                🔄 Retry
                            </button>
                            <button onClick={() => handleAdminButtonClick('phase1')} className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-white">
                                🔍 Run Phase 1
                            </button>
                        </div>
                    </div>
                </div>

                {/* Admin Controls Sidebar */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                    <button onClick={() => handleAdminButtonClick('phase1')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Search className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 1</span></button>
                    <button onClick={() => handleAdminButtonClick('phase2')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Download className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 2</span></button>
                    <button onClick={() => handleAdminButtonClick('cleanup')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Broom className="w-7 h-7 text-orange-400" /><span className="text-white text-xs">Cleanup</span></button>
                    <button onClick={() => handleAdminButtonClick('purge')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Trash className="w-7 h-7 text-red-400" /><span className="text-white text-xs">Purge</span></button>
                    <button onClick={() => handleAdminButtonClick('restart-backend')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><RefreshCw className="w-7 h-7 text-white" /><span className="text-white text-xs">Restart</span></button>
                    <button onClick={() => handleAdminButtonClick('reload-nginx')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Server className="w-7 h-7 text-white" /><span className="text-white text-xs">NGINX</span></button>
                </div>

                {/* All dialogs and overlays */}
                {showLogin && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-xl font-semibold">Admin Login</h3>
                                <button onClick={() => setShowLogin(false)}><X className="w-5 h-5 text-white" /></button>
                            </div>
                            <p className="text-gray-300 mb-4 text-sm">Enter password to access admin controls</p>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Password" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg mb-4" autoFocus />
                            {loginError && <div className="text-red-400 text-sm mb-4">{loginError}</div>}
                            <button onClick={handleLogin} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login</button>
                        </div>
                    </div>
                )}

                {showConfirmDialog && confirmAction && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                            <h3 className="text-white text-xl font-semibold mb-3">{getActionDetails(confirmAction).title}</h3>
                            <p className="text-gray-300 mb-6 text-sm">{getActionDetails(confirmAction).message}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg">Cancel</button>
                                <button onClick={() => runAdminAction(confirmAction)} className={`flex-1 px-4 py-2 rounded-lg text-white ${confirmAction === 'purge' ? 'bg-red-600' : confirmAction === 'cleanup' ? 'bg-orange-600' : 'bg-blue-600'}`}>{getActionDetails(confirmAction).confirmText}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 w-full max-w-md px-4">
                    {notifications.map(n => (
                        <div key={n.id} className={`px-6 py-3 rounded-lg text-white text-center ${n.type === 'success' ? 'bg-green-600/90' : n.type === 'error' ? 'bg-red-600/90' : 'bg-blue-600/90'}`}>{n.message}</div>
                    ))}
                </div>

                {adminLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <div className="bg-black/80 text-white px-8 py-6 rounded-lg"><div className="text-xl mb-2">Processing...</div><div className="text-sm text-gray-400">This may take a while</div></div>
                    </div>
                )}
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div ref={containerRef} className="relative h-screen w-full overflow-hidden" style={{backgroundColor: currentBg}}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                    <div className="flex items-center justify-between text-white">
                        <div className="text-lg font-semibold">SWAKES Reels</div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleCookieDialogOpen} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Manage Cookies">
                                <Cookie className="w-5 h-5 text-yellow-400" />
                            </button>
                            <button onClick={() => setShowMetadata(!showMetadata)} className="p-2"><Info className="w-5 h-5" /></button>
                            <button onClick={() => setShowColorMenu(!showColorMenu)} className="p-2"><Palette className="w-5 h-5" /></button>
                            <button onClick={toggleTheme} className="p-2">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                            {isAuthenticated ? <button onClick={handleLogout} className="text-sm px-3 py-1 bg-red-500/80 rounded">Logout</button> : <button onClick={() => setShowLogin(true)} className="p-2"><Lock className="w-5 h-5" /></button>}
                            <div className="text-sm">0 / 0</div>
                        </div>
                    </div>
                </div>

                {/* Color Menu */}
                {showColorMenu && (
                    <div className="absolute top-16 right-4 bg-gray-800 rounded-lg p-4 z-20 shadow-xl">
                        <div className="text-white text-sm font-semibold mb-3">Color Scheme</div>
                        {Object.entries(colorSchemes).map(([key, scheme]) => (
                            <button key={key} onClick={() => changeColorScheme(key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded mb-2 ${colorScheme === key ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                                <div className="w-6 h-6 rounded" style={{backgroundColor: scheme.bg}}></div>
                                <span className="text-white text-sm">{scheme.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className="text-6xl mb-4">📹</div>
                        <div className="text-2xl font-semibold mb-2">No Videos Available</div>
                        <div className="text-gray-400 mb-6">Run Phase 1 and Phase 2 to download videos</div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => handleAdminButtonClick('phase1')} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                🔍 Run Phase 1
                            </button>
                            <button onClick={() => handleAdminButtonClick('phase2')} className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                                📥 Run Phase 2
                            </button>
                        </div>
                    </div>
                </div>

                {/* Admin Controls Sidebar */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                    <button onClick={() => handleAdminButtonClick('phase1')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Search className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 1</span></button>
                    <button onClick={() => handleAdminButtonClick('phase2')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Download className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 2</span></button>
                    <button onClick={() => handleAdminButtonClick('cleanup')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Broom className="w-7 h-7 text-orange-400" /><span className="text-white text-xs">Cleanup</span></button>
                    <button onClick={() => handleAdminButtonClick('purge')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Trash className="w-7 h-7 text-red-400" /><span className="text-white text-xs">Purge</span></button>
                    <button onClick={() => handleAdminButtonClick('restart-backend')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><RefreshCw className="w-7 h-7 text-white" /><span className="text-white text-xs">Restart</span></button>
                    <button onClick={() => handleAdminButtonClick('reload-nginx')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Server className="w-7 h-7 text-white" /><span className="text-white text-xs">NGINX</span></button>
                </div>

                {/* Login Dialog */}
                {showLogin && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-xl font-semibold">Admin Login</h3>
                                <button onClick={() => setShowLogin(false)}><X className="w-5 h-5 text-white" /></button>
                            </div>
                            <p className="text-gray-300 mb-4 text-sm">Enter password to access admin controls</p>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Password" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg mb-4" autoFocus />
                            {loginError && <div className="text-red-400 text-sm mb-4">{loginError}</div>}
                            <button onClick={handleLogin} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login</button>
                        </div>
                    </div>
                )}

                {/* Cookie Dialog */}
                {showCookieDialog && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-xl font-semibold flex items-center gap-2">
                                    <Cookie className="w-6 h-6 text-yellow-400" />
                                    Cookie Manager
                                </h3>
                                <button onClick={() => setShowCookieDialog(false)}>
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {cookieLoading ? (
                                <div className="text-gray-300 mb-4 text-sm animate-pulse">Loading cookie info...</div>
                            ) : cookieInfo ? (
                                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                    <div className="text-white text-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Cookies:</span>
                                            <span className="font-semibold">{cookieInfo.cookieCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Updated:</span>
                                            <span className="font-semibold">
                                                {new Date(cookieInfo.lastModified).toLocaleString()}
                                            </span>
                                        </div>
                                        {cookieInfo.preview && cookieInfo.preview.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-600">
                                                <div className="text-gray-400 text-xs mb-2">Preview (first 3 cookies):</div>
                                                {cookieInfo.preview.map((cookie, idx) => (
                                                    <div key={idx} className="text-xs text-gray-300 mb-1">
                                                        • {cookie.domain} - {cookie.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
                                    <div className="text-yellow-200 text-sm">
                                        No cookies found. Paste new cookies below.
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-4">
                                <div className="text-blue-200 text-sm space-y-2">
                                    <div className="font-semibold">How to get cookies:</div>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                        <li>Install <a href="https://github.com/hrdl-github/cookies-txt" target="_blank" className="underline">cookies.txt extension</a></li>
                                        <li>Go to Facebook and login</li>
                                        <li>Click the extension and copy cookies</li>
                                        <li>Paste below and click "Update Cookies"</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-white text-sm font-semibold mb-2 block">
                                    Paste Cookies (Netscape format)
                                </label>
                                <textarea
                                    value={cookieInput}
                                    onChange={(e) => setCookieInput(e.target.value)}
                                    placeholder="# Netscape HTTP Cookie File&#10;.facebook.com	TRUE	/	TRUE	..."
                                    className="w-full h-48 px-4 py-2 bg-gray-700 text-white rounded-lg font-mono text-xs"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="text-white text-sm font-semibold mb-2 block">
                                    Admin Password
                                </label>
                                <input
                                    type="password"
                                    value={cookiePassword}
                                    onChange={(e) => setCookiePassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCookieDialog(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCookieUpdate}
                                    disabled={cookieLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cookieLoading ? 'Updating...' : 'Update Cookies'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Dialog */}
                {showConfirmDialog && confirmAction && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                            <h3 className="text-white text-xl font-semibold mb-3">{getActionDetails(confirmAction).title}</h3>
                            <p className="text-gray-300 mb-6 text-sm">{getActionDetails(confirmAction).message}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg">Cancel</button>
                                <button onClick={() => runAdminAction(confirmAction)} className={`flex-1 px-4 py-2 rounded-lg text-white ${confirmAction === 'purge' ? 'bg-red-600' : confirmAction === 'cleanup' ? 'bg-orange-600' : 'bg-blue-600'}`}>{getActionDetails(confirmAction).confirmText}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 w-full max-w-md px-4">
                    {notifications.map(n => (
                        <div key={n.id} className={`px-6 py-3 rounded-lg text-white text-center ${n.type === 'success' ? 'bg-green-600/90' : n.type === 'error' ? 'bg-red-600/90' : 'bg-blue-600/90'}`}>{n.message}</div>
                    ))}
                </div>

                {/* Loading Overlay */}
                {adminLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <div className="bg-black/80 text-white px-8 py-6 rounded-lg"><div className="text-xl mb-2">Processing...</div><div className="text-sm text-gray-400">This may take a while</div></div>
                    </div>
                )}
            </div>
        );
    }

    const cv = videos[currentIndex];

    return (
        <div ref={containerRef} className="relative h-screen w-full overflow-hidden" style={{backgroundColor: currentBg}} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
            <div className="absolute inset-0" onClick={togglePlay}>
                <video ref={videoRef} key={cv?.id} src={cv?.url} className={`w-full h-full object-contain transition-opacity ${watched[cv?.id] ? 'opacity-30' : 'opacity-100'}`} loop playsInline muted={isMuted} autoPlay />
                {watched[cv?.id] && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-black/60 px-6 py-3 rounded-full"><span className="text-white text-lg font-semibold">✓ Watched</span></div></div>}
            </div>

            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                <div className="flex items-center justify-between text-white">
                    <div className="text-lg font-semibold">SWAKES Reels</div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleCookieDialogOpen} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Manage Cookies">
                            <Cookie className="w-5 h-5 text-yellow-400" />
                        </button>
                        <button onClick={() => setShowMetadata(!showMetadata)} className="p-2"><Info className="w-5 h-5" /></button>
                        <button onClick={() => setShowColorMenu(!showColorMenu)} className="p-2"><Palette className="w-5 h-5" /></button>
                        <button onClick={toggleTheme} className="p-2">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                        {isAuthenticated ? <button onClick={handleLogout} className="text-sm px-3 py-1 bg-red-500/80 rounded">Logout</button> : <button onClick={() => setShowLogin(true)} className="p-2"><Lock className="w-5 h-5" /></button>}
                        <div className="text-sm">{currentIndex + 1} / {videos.length}</div>
                    </div>
                </div>
            </div>

            {showColorMenu && (
                <div className="absolute top-16 right-4 bg-gray-800 rounded-lg p-4 z-20 shadow-xl">
                    <div className="text-white text-sm font-semibold mb-3">Color Scheme</div>
                    {Object.entries(colorSchemes).map(([key, scheme]) => (
                        <button key={key} onClick={() => changeColorScheme(key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded mb-2 ${colorScheme === key ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                            <div className="w-6 h-6 rounded" style={{backgroundColor: scheme.bg}}></div>
                            <span className="text-white text-sm">{scheme.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {showMetadata && cv && (
                <div className="absolute top-20 left-4 bg-black/80 rounded-lg p-4 z-20 max-w-md backdrop-blur-sm">
                    <div className="text-white space-y-3 text-sm">
                        <div>
                            <div className="font-semibold text-base mb-1">{cv.title}</div>
                            {cv.description && (
                                <div className="text-xs opacity-80 leading-relaxed">{cv.description}</div>
                            )}
                        </div>
                        <div className="border-t border-white/20 pt-2 space-y-1">
                            <div><span className="opacity-70">File:</span> {cv.filename}</div>
                            <div><span className="opacity-70">Size:</span> {cv.size ? `${(cv.size / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}</div>
                            <div><span className="opacity-70">Duration:</span> {cv.duration ? `${Math.floor(cv.duration / 60)}:${(cv.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</div>
                            <div><span className="opacity-70">Date:</span> {cv.uploadDate ? new Date(cv.uploadDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-32 left-4 right-20 z-10 text-white">
                <div className="text-base font-semibold truncate">{cv?.title || cv?.filename}</div>
                {cv?.description && (
                    <div className="text-xs opacity-75 mt-1 line-clamp-2">{cv.description}</div>
                )}
            </div>

            <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
                <button onClick={toggleWatched} className="flex flex-col items-center gap-1">
                    {watched[cv?.id] ? <EyeOff className="w-7 h-7 text-green-400" /> : <Eye className="w-7 h-7 text-white" />}
                    <span className={`text-xs ${watched[cv?.id] ? 'text-green-400' : 'text-white'}`}>{watched[cv?.id] ? 'Watched' : 'Mark'}</span>
                </button>
                <div className="w-full h-px bg-white/30 my-2"></div>
                <button onClick={() => handleAdminButtonClick('phase1')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Search className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 1</span></button>
                <button onClick={() => handleAdminButtonClick('phase2')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Download className="w-7 h-7 text-white" /><span className="text-white text-xs">Phase 2</span></button>
                <button onClick={() => handleAdminButtonClick('cleanup')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Broom className="w-7 h-7 text-orange-400" /><span className="text-white text-xs">Cleanup</span></button>
                <button onClick={() => handleAdminButtonClick('purge')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Trash className="w-7 h-7 text-red-400" /><span className="text-white text-xs">Purge</span></button>
                <button onClick={() => handleAdminButtonClick('restart-backend')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><RefreshCw className="w-7 h-7 text-white" /><span className="text-white text-xs">Restart</span></button>
                <button onClick={() => handleAdminButtonClick('reload-nginx')} disabled={adminLoading} className="flex flex-col items-center gap-1 disabled:opacity-50"><Server className="w-7 h-7 text-white" /><span className="text-white text-xs">NGINX</span></button>
            </div>

            {showLogin && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-xl font-semibold">Admin Login</h3>
                            <button onClick={() => setShowLogin(false)}><X className="w-5 h-5 text-white" /></button>
                        </div>
                        <p className="text-gray-300 mb-4 text-sm">Enter password to access admin controls</p>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Password" className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg mb-4" autoFocus />
                        {loginError && <div className="text-red-400 text-sm mb-4">{loginError}</div>}
                        <button onClick={handleLogin} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login</button>
                    </div>
                </div>
            )}

            {showCookieDialog && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-xl font-semibold flex items-center gap-2">
                                <Cookie className="w-6 h-6 text-yellow-400" />
                                Cookie Manager
                            </h3>
                            <button onClick={() => setShowCookieDialog(false)}>
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Cookie Status */}
                        {cookieLoading ? (
                            <div className="text-gray-300 mb-4 text-sm animate-pulse">Loading cookie info...</div>
                        ) : cookieInfo ? (
                            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                <div className="text-white text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Cookies:</span>
                                        <span className="font-semibold">{cookieInfo.cookieCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Last Updated:</span>
                                        <span className="font-semibold">
                                            {new Date(cookieInfo.lastModified).toLocaleString()}
                                        </span>
                                    </div>
                                    {cookieInfo.preview && cookieInfo.preview.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-600">
                                            <div className="text-gray-400 text-xs mb-2">Preview (first 3 cookies):</div>
                                            {cookieInfo.preview.map((cookie, idx) => (
                                                <div key={idx} className="text-xs text-gray-300 mb-1">
                                                    • {cookie.domain} - {cookie.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
                                <div className="text-yellow-200 text-sm">
                                    No cookies found. Paste new cookies below.
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-4">
                            <div className="text-blue-200 text-sm space-y-2">
                                <div className="font-semibold">How to get cookies:</div>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Install <a href="https://github.com/hrdl-github/cookies-txt" target="_blank" className="underline">cookies.txt extension</a></li>
                                    <li>Go to Facebook and login</li>
                                    <li>Click the extension and copy cookies</li>
                                    <li>Paste below and click "Update Cookies"</li>
                                </ol>
                            </div>
                        </div>

                        {/* Cookie Input */}
                        <div className="mb-4">
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Paste Cookies (Netscape format)
                            </label>
                            <textarea
                                value={cookieInput}
                                onChange={(e) => setCookieInput(e.target.value)}
                                placeholder="# Netscape HTTP Cookie File&#10;.facebook.com	TRUE	/	TRUE	..."
                                className="w-full h-48 px-4 py-2 bg-gray-700 text-white rounded-lg font-mono text-xs"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="mb-4">
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Admin Password
                            </label>
                            <input
                                type="password"
                                value={cookiePassword}
                                onChange={(e) => setCookiePassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCookieDialog(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCookieUpdate}
                                disabled={cookieLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cookieLoading ? 'Updating...' : 'Update Cookies'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDialog && confirmAction && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                        <h3 className="text-white text-xl font-semibold mb-3">{getActionDetails(confirmAction).title}</h3>
                        <p className="text-gray-300 mb-6 text-sm">{getActionDetails(confirmAction).message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg">Cancel</button>
                            <button onClick={() => runAdminAction(confirmAction)} className={`flex-1 px-4 py-2 rounded-lg text-white ${confirmAction === 'purge' ? 'bg-red-600' : confirmAction === 'cleanup' ? 'bg-orange-600' : 'bg-blue-600'}`}>{getActionDetails(confirmAction).confirmText}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 w-full max-w-md px-4">
                {notifications.map(n => (
                    <div key={n.id} className={`px-6 py-3 rounded-lg text-white text-center ${n.type === 'success' ? 'bg-green-600/90' : n.type === 'error' ? 'bg-red-600/90' : 'bg-blue-600/90'}`}>{n.message}</div>
                ))}
            </div>

            {adminLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                    <div className="bg-black/80 text-white px-8 py-6 rounded-lg"><div className="text-xl mb-2">Processing...</div><div className="text-sm text-gray-400">This may take a while</div></div>
                </div>
            )}

            <div className="absolute bottom-8 left-4 flex gap-4 z-10">
                <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                </button>
                <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FBReelsClone />);
