"""
Enhanced Movie Scraper with Automatic Session Management
"""

import requests
import json
import sys
from session_manager import get_session_manager


def search_movies(query):
    """
    Search for movies by title on moviebox.ph
    
    Args:
        query: Search query string
        
    Returns:
        List of movie dictionaries with title, slug, image, etc.
    """
    try:
        # The site uses a search API endpoint
        # Based on typical patterns, trying common API paths
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        headers = {
            'accept': 'application/json',
            'accept-language': 'en,en-CA;q=0.9,fr;q=0.8',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
        }
        
        # Try the search API (will need to be verified)
        api_url = f"https://moviebox.ph/api/search?q={query}"
        
        print(f"[*] Searching for: {query}")
        try:
            response = session.get(api_url, headers=headers, timeout=10)
            response.raise_for_status()
            try:
                data = response.json()
                return data
            except json.JSONDecodeError:
                print(f"[-] JSON Decode Error. Response content: {response.text[:500]}")
                return []
        except requests.exceptions.HTTPError as e:
            print(f"[-] HTTP Error: {e}")
            print(f"[-] Response content: {e.response.text[:500]}")
            if e.response.status_code == 404:
                # API endpoint might be different, try alternative
                print(f"[!] Search API not found at {api_url}, trying alternative...")
                # For now, return empty results - we'll need to reverse engineer this
                return []
            raise
            
    except Exception as e:
        print(f"[-] Search error: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_movie_stream(slug, subject_id=None):
    """
    Get the actual movie stream URL using the playback API.
    Now uses automatic session management with no hardcoded cookies!
    
    Args:
        slug: Movie slug like "natural-disaster-arabic-Iu6LI2yUkW2"
        subject_id: Subject ID for the movie
        
    Returns:
        dict with video info or None
    """
    if not subject_id:
        print(f"[-] Subject ID required for slug: {slug}")
        return None
    
    try:
        # Get session with auto-refreshing cookies
        session_manager = get_session_manager()
        session = session_manager.get_session()
        
        # Headers for API request
        headers = {
            'accept': 'application/json',
            'accept-language': 'en,en-CA;q=0.9,fr;q=0.8',
            'referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
            'x-client-info': '{"timezone":"UTC"}',
        }
        
        # Call the playback API with correct parameters
        api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={subject_id}&se=0&ep=0&detail_path={slug}"
        
        print(f"[*] Fetching stream for: {slug}")
        print(f"[*] Subject ID: {subject_id}")
        
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract video URL
        if data.get('code') == 0 and data.get('data', {}).get('hasResource'):
            streams = data['data'].get('streams', [])
            if streams:
                video_info = streams[0]
                
                print(f"[+] SUCCESS! Found stream:")
                print(f"    URL: {video_info['url']}")
                print(f"    Resolution: {video_info.get('resolutions', 'unknown')}")
                print(f"    Size: {int(video_info.get('size', 0)) / 1024 / 1024:.2f} MB")
                print(f"    Duration: {video_info.get('duration', 0)}s ({video_info.get('duration', 0) // 60} min)")
                
                return {
                    'slug': slug,
                    'subjectId': subject_id,
                    'url': video_info['url'],
                    'resolution': video_info.get('resolutions'),
                    'size_bytes': video_info.get('size'),
                    'duration_seconds': video_info.get('duration'),
                    'format': video_info.get('format'),
                }
            else:
                print("[-] No streams in response")
                return None
        else:
            print(f"[-] API error: {data.get('message', 'unknown')}")
            print(f"    hasResource: {data.get('data', {}).get('hasResource')}")
            
            # If hasResource is False, cookies might be invalid, try refreshing
            if not data.get('data', {}).get('hasResource'):
                print("[!] No resource found - cookies might be invalid. Forcing refresh...")
                session_manager.cookies_obtained_at = None  # Force refresh
                session = session_manager.get_session()
                
                # Retry once with fresh cookies
                print("[*] Retrying with fresh cookies...")
                response = session.get(api_url, headers=headers, timeout=10)
                data = response.json()
                
                if data.get('code') == 0 and data.get('data', {}).get('hasResource'):
                    streams = data['data'].get('streams', [])
                    if streams:
                        video_info = streams[0]
                        print(f"[+] SUCCESS after cookie refresh!")
                        return {
                            'slug': slug,
                            'subjectId': subject_id,
                            'url': video_info['url'],
                            'resolution': video_info.get('resolutions'),
                            'size_bytes': video_info.get('size'),
                            'duration_seconds': video_info.get('duration'),
                            'format': video_info.get('format'),
                        }
            
            return None
            
    except Exception as e:
        print(f"[-] Error: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    if len(sys.argv) > 1:
        slug = sys.argv[1]
        subject_id = sys.argv[2] if len(sys.argv) > 2 else None
    else:
        # Use the test case we know works
        slug = "natural-disaster-arabic-Iu6LI2yUkW2"
        subject_id = "2468315697651272720"
        print(f"[*] No args provided, using test case")
    
    result = get_movie_stream(slug, subject_id)
    
    if result:
        print("\n" + "="*60)
        print("✓ SUCCESS! Here's the movie stream data:")
        print(json.dumps(result, indent=2))
        print("="*60)
    else:
        print("\n" + "="*60)
        print("✗ FAILED to get stream")
        print("="*60)
