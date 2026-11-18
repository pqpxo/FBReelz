#!/usr/bin/env node

/**
 * FBReelz Video Cleanup Script
 * Deletes videos marked as watched for more than 3 days
 */

const fs = require('fs').promises;
const path = require('path');

const VIDEO_DIR = process.env.VIDEO_DIR || '/opt/fbreelz/data/cache';
const WATCHED_FILE = process.env.WATCHED_FILE || '/opt/fbreelz/data/watched.json';
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '3', 10);

async function cleanup() {
    console.log('=== FBReelz Video Cleanup ===');
    console.log(`Retention period: ${RETENTION_DAYS} days`);
    console.log(`Video directory: ${VIDEO_DIR}`);
    console.log(`Watched file: ${WATCHED_FILE}`);
    console.log('');

    try {
        // Load watched status
        const watchedData = await fs.readFile(WATCHED_FILE, 'utf8');
        const watched = JSON.parse(watchedData);

        const now = Date.now();
        const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        let deletedCount = 0;
        let deletedSize = 0;
        const deletedVideos = [];
        const updatedWatched = {};

        // Get all video files
        const files = await fs.readdir(VIDEO_DIR);
        const videoFiles = files.filter(file =>
            file.toLowerCase().endsWith('.mp4') ||
            file.toLowerCase().endsWith('.mkv') ||
            file.toLowerCase().endsWith('.webm')
        );

        console.log(`Found ${videoFiles.length} video files`);
        console.log(`Found ${Object.keys(watched).length} watched entries`);
        console.log('');

        // Check each watched video
        for (const [videoId, watchedInfo] of Object.entries(watched)) {
            let shouldDelete = false;
            let timestamp;

            // Handle both old format (boolean) and new format (object with timestamp)
            if (typeof watchedInfo === 'boolean' && watchedInfo) {
                // Old format - mark for deletion (assume old)
                shouldDelete = true;
                timestamp = 'unknown (old format)';
            } else if (typeof watchedInfo === 'object') {
                // Skip if already cleaned
                if (watchedInfo.cleaned) {
                    console.log(`Video ID ${videoId}: Already cleaned, skipping`);
                    updatedWatched[videoId] = watchedInfo; // Keep the cleaned status
                    continue;
                }
                
                // New format with timestamp
                if (watchedInfo.timestamp) {
                    timestamp = watchedInfo.timestamp;
                    const watchedTime = new Date(timestamp).getTime();
                    const age = now - watchedTime;
                    
                    if (age > retentionMs) {
                        shouldDelete = true;
                        const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
                        console.log(`Video ID ${videoId}: Watched ${daysOld} days ago (${timestamp})`);
                    }
                }
            }

            if (shouldDelete) {
                // Find matching video file
                const videoFile = videoFiles.find(f => {
                    // Try to match by ID in filename
                    return f.includes(`_${videoId}_`) || f.includes(`_${videoId}.`);
                });

                if (videoFile) {
                    const videoPath = path.join(VIDEO_DIR, videoFile);
                    const metaPath = videoPath.replace(/\.(mp4|mkv|webm)$/i, '.json');

                    try {
                        // Get file size before deletion
                        const stats = await fs.stat(videoPath);
                        deletedSize += stats.size;

                        // Delete video file
                        await fs.unlink(videoPath);
                        console.log(`✓ Deleted: ${videoFile} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

                        // Delete metadata file if exists
                        try {
                            await fs.unlink(metaPath);
                            console.log(`✓ Deleted metadata: ${path.basename(metaPath)}`);
                        } catch (e) {
                            // Metadata file might not exist
                        }

                        deletedCount++;
                        deletedVideos.push({
                            filename: videoFile,
                            size: stats.size,
                            watchedAt: timestamp
                        });

                        // Mark as cleaned instead of removing entry
                        updatedWatched[videoId] = {
                            ...watchedInfo,
                            cleaned: true,
                            cleanedAt: new Date().toISOString()
                        };
                        
                        console.log(`✓ Marked as cleaned: Video ID ${videoId}`);

                    } catch (err) {
                        console.error(`✗ Error deleting ${videoFile}:`, err.message);
                        // Keep in watched list if deletion failed
                        updatedWatched[videoId] = watchedInfo;
                    }
                } else {
                    console.log(`⚠ Video ID ${videoId} not found in cache (already deleted?)`);
                    // Mark as cleaned even if file not found (might have been manually deleted)
                    updatedWatched[videoId] = {
                        ...(typeof watchedInfo === 'object' ? watchedInfo : { timestamp: 'unknown', marked: true }),
                        cleaned: true,
                        cleanedAt: new Date().toISOString()
                    };
                }
            } else {
                // Keep unwatched or recent videos
                updatedWatched[videoId] = watchedInfo;
            }
        }

        // Update watched.json with remaining entries
        await fs.writeFile(WATCHED_FILE, JSON.stringify(updatedWatched, null, 2));

        console.log('');
        console.log('=== Cleanup Summary ===');
        console.log(`Videos deleted: ${deletedCount}`);
        console.log(`Space freed: ${(deletedSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`Watched entries remaining: ${Object.keys(updatedWatched).length}`);
        console.log('');

        // Return results for API endpoint
        return {
            success: true,
            deletedCount,
            deletedSize,
            deletedVideos,
            remainingWatched: Object.keys(updatedWatched).length,
            message: `Deleted ${deletedCount} videos (${(deletedSize / (1024 * 1024)).toFixed(2)} MB freed)`
        };

    } catch (error) {
        console.error('Cleanup error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Cleanup failed'
        };
    }
}

// Run if called directly
if (require.main === module) {
    cleanup().then(result => {
        console.log('Cleanup complete!');
        process.exit(result.success ? 0 : 1);
    });
}

// Export for use in server.js
module.exports = cleanup;
