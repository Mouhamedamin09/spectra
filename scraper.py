import requests
import json
import sys

# Load the slug to ID mapping
try:
    with open('slug_to_id_mapping.json', 'r') as f:
        slug_mapping = json.load(f)
except FileNotFoundError:
    print("[!] slug_to_id_mapping.json not found. Using empty mapping.")
    slug_mapping = {}

def get_movie_stream(slug, subject_id=None):
    """
    Get the actual movie stream URL using the playback API.
    
    Args:
        slug: Movie slug like "natural-disaster-arabic-Iu6LI2yUkW2"
        subject_id: Optional subject ID. If not provided, will try to look it up in mapping.
        
    Returns:
        dict with video info or None
    """
    # If no subject_id provided, try to find it in mapping
    if not subject_id:
        subject_id = slug_mapping.get(slug)
        if not subject_id:
            print(f"[-] No subject ID found for slug: {slug}")
            print(f"[!] Add it to slug_to_id_mapping.json manually")
            return None
    
    try:
        # Headers from working browser request
        headers = {
            'accept': 'application/json',
            'accept-language': 'en,en-CA;q=0.9,fr;q=0.8',
            'referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
            'x-client-info': '{"timezone":"Africa/Tunis"}',
        }
        
        # Cookies from working request
        cookies = {
            'account': '6970876698850380840|0|H5|1763341200|',
            'uuid': '2ca51532-1ae1-4d93-b3ff-8b355b0c72a5',
            '_ga': 'GA1.1.488511106.1763341203',
            '_ga_5W8GT0FPB7': 'GS2.1.s1764113217$o2$g1$t1764115074$j59$l0$h0',
        }
        
        # Call the playback API
        api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={subject_id}&se=1&ep=1&detail_path={slug}"
        
        print(f"[*] Fetching stream for: {slug}")
        print(f"[*] Subject ID: {subject_id}")
        
        response = requests.get(api_url, headers=headers, cookies=cookies, timeout=10)
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
