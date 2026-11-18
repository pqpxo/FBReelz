#!/usr/bin/env python3
"""
FBReelz - Cleaned Videos Filter
Helps Phase 2 skip downloading videos that have been cleaned up
"""

import json
import os
from pathlib import Path

WATCHED_FILE = os.environ.get('WATCHED_FILE', '/opt/fbreelz/data/watched.json')

def load_cleaned_videos():
    """
    Load the list of video IDs that have been cleaned up
    Returns a set of video IDs (as strings) that should not be re-downloaded
    """
    try:
        with open(WATCHED_FILE, 'r') as f:
            watched = json.load(f)
        
        cleaned_ids = set()
        
        for video_id, status in watched.items():
            # Check if video has been cleaned
            if isinstance(status, dict) and status.get('cleaned', False):
                cleaned_ids.add(str(video_id))
        
        return cleaned_ids
    
    except FileNotFoundError:
        # No watched file yet, return empty set
        return set()
    except Exception as e:
        print(f"Warning: Error loading cleaned videos: {e}")
        return set()


def is_video_cleaned(video_id):
    """
    Check if a specific video ID has been cleaned
    
    Args:
        video_id: The video ID to check (can be string or int)
    
    Returns:
        bool: True if video was cleaned and should be skipped
    """
    try:
        with open(WATCHED_FILE, 'r') as f:
            watched = json.load(f)
        
        video_id_str = str(video_id)
        
        if video_id_str in watched:
            status = watched[video_id_str]
            if isinstance(status, dict):
                return status.get('cleaned', False)
        
        return False
    
    except Exception:
        return False


def get_cleaned_video_info(video_id):
    """
    Get detailed information about a cleaned video
    
    Args:
        video_id: The video ID to check
    
    Returns:
        dict or None: Information about the cleaned video, or None if not cleaned
    """
    try:
        with open(WATCHED_FILE, 'r') as f:
            watched = json.load(f)
        
        video_id_str = str(video_id)
        
        if video_id_str in watched:
            status = watched[video_id_str]
            if isinstance(status, dict) and status.get('cleaned', False):
                return {
                    'video_id': video_id_str,
                    'watched_at': status.get('timestamp', 'unknown'),
                    'cleaned_at': status.get('cleanedAt', 'unknown'),
                    'cleaned': True
                }
        
        return None
    
    except Exception:
        return None


def filter_videos_for_download(video_urls):
    """
    Filter a list of video URLs/IDs to exclude cleaned videos
    
    Args:
        video_urls: List of video URLs or IDs to filter
    
    Returns:
        tuple: (videos_to_download, skipped_cleaned_videos)
    """
    cleaned_ids = load_cleaned_videos()
    
    to_download = []
    skipped = []
    
    for video in video_urls:
        # Extract ID from URL or use as-is if it's already an ID
        video_id = extract_video_id(video)
        
        if video_id in cleaned_ids:
            skipped.append(video)
        else:
            to_download.append(video)
    
    return to_download, skipped


def extract_video_id(video_url_or_id):
    """
    Extract video ID from URL or return as-is if already an ID
    
    Args:
        video_url_or_id: Either a full Facebook URL or a video ID
    
    Returns:
        str: The video ID
    """
    if isinstance(video_url_or_id, dict):
        # Handle dict with 'id' field
        return str(video_url_or_id.get('id', ''))
    
    video_str = str(video_url_or_id)
    
    # If it's a URL, try to extract ID
    if 'facebook.com' in video_str:
        # Try to extract ID from various Facebook URL formats
        # /reel/123456789
        if '/reel/' in video_str:
            parts = video_str.split('/reel/')
            if len(parts) > 1:
                return parts[1].split('/')[0].split('?')[0]
        
        # /watch/?v=123456789
        if 'v=' in video_str:
            parts = video_str.split('v=')
            if len(parts) > 1:
                return parts[1].split('&')[0].split('/')[0]
        
        # /videos/123456789
        if '/videos/' in video_str:
            parts = video_str.split('/videos/')
            if len(parts) > 1:
                return parts[1].split('/')[0].split('?')[0]
    
    # Return as-is if we couldn't extract (might already be just an ID)
    return video_str


def print_cleaned_summary():
    """Print a summary of all cleaned videos"""
    try:
        with open(WATCHED_FILE, 'r') as f:
            watched = json.load(f)
        
        cleaned_videos = []
        
        for video_id, status in watched.items():
            if isinstance(status, dict) and status.get('cleaned', False):
                cleaned_videos.append({
                    'id': video_id,
                    'watched_at': status.get('timestamp', 'unknown'),
                    'cleaned_at': status.get('cleanedAt', 'unknown')
                })
        
        print(f"\n=== Cleaned Videos Summary ===")
        print(f"Total cleaned: {len(cleaned_videos)}")
        print()
        
        if cleaned_videos:
            print("Video IDs that will be skipped:")
            for video in cleaned_videos[:10]:  # Show first 10
                print(f"  - {video['id']} (cleaned: {video['cleaned_at']})")
            
            if len(cleaned_videos) > 10:
                print(f"  ... and {len(cleaned_videos) - 10} more")
        
        print()
        
    except Exception as e:
        print(f"Error reading cleaned videos: {e}")


if __name__ == '__main__':
    # When run directly, print summary
    print_cleaned_summary()
    
    # Test the functions
    cleaned_ids = load_cleaned_videos()
    print(f"Loaded {len(cleaned_ids)} cleaned video IDs")
