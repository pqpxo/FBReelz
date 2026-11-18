#!/usr/bin/env python3
"""
FBReelz Phase 2 - Video Download with Cleaned Filter
Version 8 - Smart Cleanup Edition

Downloads videos from Phase 1 output, skipping videos that have been cleaned up.
Includes Pushover notifications, title-based filenames, and resume support.
"""

import argparse
import json
import logging
import os
import re
import sys
import time
import requests
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Add path for cleaned videos filter
sys.path.insert(0, '/opt/fbreelz')
try:
    from cleaned_videos_filter import load_cleaned_videos, is_video_cleaned
    FILTER_AVAILABLE = True
except ImportError:
    print("Warning: cleaned_videos_filter not found - will download all videos")
    FILTER_AVAILABLE = False

# Pushover configuration
PUSHOVER_USER_KEY = os.environ.get("PUSHOVER_USER_KEY", "")
PUSHOVER_APP_TOKEN = os.environ.get("PUSHOVER_APP_TOKEN", "")

# Configuration
DATA_DIR = Path(os.environ.get("FBREELZ_DATA_DIR", "/opt/fbreelz/data"))
CACHE_DIR = DATA_DIR / "cache"
DEFAULT_INPUT = DATA_DIR / "saved_items.json"
DEFAULT_OUTPUT = DATA_DIR / "resolved_items.json"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(DATA_DIR / "fbreelz_phase2.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def _send_pushover(title: str, message: str, priority: int = 0) -> bool:
    """Send push notification via Pushover."""
    try:
        response = requests.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token": PUSHOVER_APP_TOKEN,
                "user": PUSHOVER_USER_KEY,
                "title": title,
                "message": message,
                "priority": priority
            },
            timeout=10
        )
        
        if response.status_code == 200:
            logger.debug("Pushover notification sent successfully")
            return True
        else:
            logger.warning(f"Pushover notification failed: {response.status_code}")
            return False
    except Exception as e:
        logger.warning(f"Failed to send Pushover notification: {e}")
        return False


def sanitize_filename(filename: str, max_length: int = 200) -> str:
    """
    Sanitize filename to be filesystem-safe.
    
    Args:
        filename: The filename to sanitize
        max_length: Maximum length for filename
    
    Returns:
        Safe filename string
    """
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
    
    # Replace multiple spaces/underscores with single
    filename = re.sub(r'[\s_]+', '_', filename)
    
    # Remove leading/trailing spaces and dots
    filename = filename.strip('. ')
    
    # Truncate if too long
    if len(filename) > max_length:
        filename = filename[:max_length]
    
    # Ensure not empty
    if not filename:
        filename = "video"
    
    return filename


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract video ID from Facebook URL.
    
    Args:
        url: Facebook video URL
    
    Returns:
        Video ID or None
    """
    # Try different URL patterns
    patterns = [
        r'/reel/(\d+)',
        r'v=(\d+)',
        r'/videos/(\d+)',
        r'/(\d+)/'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


def extract_video_info_from_edge(edge: Dict[str, Any], index: int) -> Dict[str, Any]:
    """
    Extract video information from Phase 1 edge data.
    
    Args:
        edge: Edge object from Phase 1 JSON
        index: Video index number
    
    Returns:
        Dictionary with video information
    """
    try:
        node = edge.get('node', {})
        savable = node.get('savable', {})
        
        url = savable.get('savable_permalink', '')
        video_id = extract_video_id(url) or str(index + 1)
        
        # Try to get title and description
        title = savable.get('title', '')
        description = savable.get('description', '')
        
        # Fallback titles
        if not title:
            title = f"Facebook_Video_{video_id}"
        
        return {
            'id': video_id,
            'url': url,
            'title': title,
            'description': description,
            'index': index
        }
    except Exception as e:
        logger.warning(f"Error extracting info from edge {index}: {e}")
        return {
            'id': str(index + 1),
            'url': '',
            'title': f"Facebook_Video_{index + 1}",
            'description': '',
            'index': index
        }


def download_video_ytdlp(url: str, output_path: Path) -> Tuple[bool, Optional[str]]:
    """
    Download video using yt-dlp.
    
    Args:
        url: Video URL
        output_path: Path to save video
    
    Returns:
        Tuple of (success, error_message)
    """
    try:
        cmd = [
            'yt-dlp',
            '--no-warnings',
            '--no-playlist',
            '-f', 'best',
            '-o', str(output_path),
            url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout per video
        )
        
        if result.returncode == 0:
            return True, None
        else:
            error = result.stderr or result.stdout or "Unknown error"
            return False, error
            
    except subprocess.TimeoutExpired:
        return False, "Download timeout (5 minutes)"
    except FileNotFoundError:
        return False, "yt-dlp not found - please install: pip install yt-dlp"
    except Exception as e:
        return False, str(e)


def download_video_curl(url: str, output_path: Path) -> Tuple[bool, Optional[str]]:
    """
    Download video using curl (fallback method).
    
    Args:
        url: Video URL
        output_path: Path to save video
    
    Returns:
        Tuple of (success, error_message)
    """
    try:
        cmd = [
            'curl',
            '-L',  # Follow redirects
            '-o', str(output_path),
            '--max-time', '300',  # 5 minute timeout
            '--silent',
            '--show-error',
            url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=310
        )
        
        if result.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
            return True, None
        else:
            error = result.stderr or "Download failed"
            return False, error
            
    except Exception as e:
        return False, str(e)


def save_metadata(video_info: Dict[str, Any], output_path: Path) -> None:
    """
    Save video metadata to JSON file.
    
    Args:
        video_info: Video information dictionary
        output_path: Path to video file (will save .json alongside)
    """
    try:
        metadata_path = output_path.with_suffix('.json')
        
        metadata = {
            'title': video_info.get('title', ''),
            'description': video_info.get('description', ''),
            'url': video_info.get('url', ''),
            'video_id': video_info.get('id', ''),
            'downloaded_at': datetime.now(timezone.utc).isoformat(),
            'filename': output_path.name
        }
        
        metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
        logger.debug(f"Saved metadata: {metadata_path.name}")
        
    except Exception as e:
        logger.warning(f"Failed to save metadata: {e}")


def load_phase1_data(input_file: Path) -> List[Dict[str, Any]]:
    """
    Load Phase 1 output data.
    
    Args:
        input_file: Path to saved_items.json
    
    Returns:
        List of edges (video items)
    """
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        # Navigate the Phase 1 JSON structure
        edges = data.get('data', {}).get('viewer', {}).get('saver_info', {}).get('all_saves', {}).get('edges', [])
        
        logger.info(f"Loaded {len(edges)} videos from Phase 1")
        return edges
        
    except FileNotFoundError:
        logger.error(f"Phase 1 output not found: {input_file}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in Phase 1 output: {e}")
        raise
    except Exception as e:
        logger.error(f"Error loading Phase 1 data: {e}")
        raise


def main(args: argparse.Namespace) -> int:
    """Main execution function."""
    start_time = time.time()
    start_datetime = datetime.now()
    
    logger.info("=" * 60)
    logger.info("FBReelz Phase 2 - Video Download (Smart Cleanup Edition)")
    logger.info("=" * 60)
    
    # Create cache directory
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load Phase 1 data
    try:
        edges = load_phase1_data(args.input)
    except Exception as e:
        logger.error(f"Failed to load Phase 1 data: {e}")
        return 1
    
    if not edges:
        logger.warning("No videos found in Phase 1 output")
        return 0
    
    # Load cleaned videos filter
    cleaned_ids = set()
    if FILTER_AVAILABLE and not args.no_filter:
        try:
            cleaned_ids = load_cleaned_videos()
            logger.info(f"Loaded {len(cleaned_ids)} cleaned video IDs to skip")
        except Exception as e:
            logger.warning(f"Failed to load cleaned videos filter: {e}")
    
    # Extract video info and filter
    videos_to_process = []
    skipped_cleaned = 0
    
    for index, edge in enumerate(edges):
        video_info = extract_video_info_from_edge(edge, index)
        
        # Skip if cleaned
        if video_info['id'] in cleaned_ids:
            logger.info(f"⏭️  Skipping cleaned video: {video_info['id']} - {video_info['title']}")
            skipped_cleaned += 1
            continue
        
        videos_to_process.append(video_info)
    
    logger.info(f"Videos to process: {len(videos_to_process)}")
    logger.info(f"Skipped (cleaned): {skipped_cleaned}")
    
    if not videos_to_process:
        logger.info("No videos to download (all cleaned or none available)")
        return 0
    
    # Apply max limit
    if args.max and args.max > 0:
        videos_to_process = videos_to_process[:args.max]
        logger.info(f"Limited to first {args.max} videos")
    
    # Download videos
    results = {
        'success': 0,
        'error': 0,
        'skipped': skipped_cleaned,
        'already_exists': 0,
        'total_size': 0,
        'downloads': []
    }
    
    for idx, video_info in enumerate(videos_to_process, 1):
        logger.info(f"\n[{idx}/{len(videos_to_process)}] Processing: {video_info['title']}")
        
        # Generate filename
        safe_title = sanitize_filename(video_info['title'])
        video_filename = f"{safe_title}_{video_info['id']}.mp4"
        output_path = CACHE_DIR / video_filename
        
        # Check if already exists
        if output_path.exists() and not args.force:
            file_size = output_path.stat().st_size
            logger.info(f"✓ Already exists: {video_filename} ({file_size / (1024*1024):.1f} MB)")
            results['already_exists'] += 1
            results['total_size'] += file_size
            continue
        
        # Download
        if args.download:
            logger.info(f"Downloading from: {video_info['url']}")
            
            # Try yt-dlp first
            success, error = download_video_ytdlp(video_info['url'], output_path)
            
            # Fallback to curl if yt-dlp fails
            if not success and args.fallback_curl:
                logger.warning(f"yt-dlp failed: {error}")
                logger.info("Trying curl fallback...")
                success, error = download_video_curl(video_info['url'], output_path)
            
            if success:
                file_size = output_path.stat().st_size
                logger.info(f"✓ Downloaded: {video_filename} ({file_size / (1024*1024):.1f} MB)")
                
                # Save metadata
                save_metadata(video_info, output_path)
                
                results['success'] += 1
                results['total_size'] += file_size
                results['downloads'].append({
                    'filename': video_filename,
                    'title': video_info['title'],
                    'size': file_size,
                    'video_id': video_info['id']
                })
            else:
                logger.error(f"✗ Failed: {error}")
                results['error'] += 1
        else:
            logger.info(f"[DRY RUN] Would download: {video_filename}")
    
    # Calculate duration
    end_time = time.time()
    duration_seconds = int(end_time - start_time)
    duration_mins = duration_seconds // 60
    duration_secs = duration_seconds % 60
    
    # Save output JSON
    output_data = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'started_at': start_datetime.isoformat(),
        'duration_seconds': duration_seconds,
        'phase1_input': str(args.input),
        'results': results,
        'videos': results['downloads']
    }
    
    args.output.write_text(json.dumps(output_data, indent=2, ensure_ascii=False))
    logger.info(f"\nSaved results to: {args.output}")
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info(f"✓ Successfully downloaded: {results['success']}")
    logger.info(f"✓ Already existed: {results['already_exists']}")
    logger.info(f"⏭️  Skipped (cleaned): {results['skipped']}")
    logger.info(f"✗ Errors: {results['error']}")
    logger.info(f"📦 Total size: {results['total_size'] / (1024*1024):.1f} MB")
    logger.info(f"⏱️  Duration: {duration_mins}m {duration_secs}s")
    logger.info("=" * 60)
    
    # Send Pushover notification (only when both keys are set in .env)
    if not args.no_pushover and PUSHOVER_APP_TOKEN and PUSHOVER_USER_KEY:
        message = (
            f"⏰ Started: {start_datetime.strftime('%H:%M:%S')}\n"
            f"⏱️ Duration: {duration_mins}m {duration_secs}s\n"
            f"📥 Total Videos: {len(videos_to_process) + results['skipped']}\n"
            f"⏭️  Skipped (cleaned): {results['skipped']}\n"
            f"🆕 New Downloads: {results['success']}\n"
            f"✓ Success: {results['success']}\n"
            f"✗ Errors: {results['error']}\n"
            f"⭐ Already Had: {results['already_exists']}\n"
            f"📦 Total Size: {results['total_size'] / (1024*1024):.1f} MB"
        )
        
        _send_pushover("✅ FBReelz Phase 2 Complete", message)
        logger.info("Pushover notification sent")
    
    return 0 if results['error'] == 0 else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="FBReelz Phase 2 - Download videos with smart cleanup filter"
    )
    
    parser.add_argument(
        '--input',
        type=Path,
        default=DEFAULT_INPUT,
        help=f'Input JSON from Phase 1 (default: {DEFAULT_INPUT})'
    )
    
    parser.add_argument(
        '--output',
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f'Output JSON file (default: {DEFAULT_OUTPUT})'
    )
    
    parser.add_argument(
        '--download',
        action='store_true',
        help='Actually download videos (default: dry run)'
    )
    
    parser.add_argument(
        '--max',
        type=int,
        default=0,
        help='Maximum number of videos to download (0 = all)'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Re-download even if file exists'
    )
    
    parser.add_argument(
        '--no-filter',
        action='store_true',
        help='Disable cleaned videos filter'
    )
    
    parser.add_argument(
        '--no-pushover',
        action='store_true',
        help='Disable Pushover notifications'
    )
    
    parser.add_argument(
        '--fallback-curl',
        action='store_true',
        help='Use curl as fallback if yt-dlp fails'
    )
    
    args = parser.parse_args()
    
    try:
        sys.exit(main(args))
    except KeyboardInterrupt:
        logger.info("\n\nInterrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)
