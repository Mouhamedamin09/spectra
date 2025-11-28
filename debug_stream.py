import requests
import json
from session_manager import get_session_manager

def debug_stream():
    print("=" * 60)
    print("DEBUGGING STREAM API")
    print("=" * 60)
    
    # Using the movie from your error log
    slug = "al-sada-al-afadel-arabic-uhxaFvYCtm4"
    subject_id = "3661482488930750752"
    season = "0"
    episode = "0"
    
    session_manager = get_session_manager()
    session = session_manager.get_session()
    
    # Stream API
    api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={subject_id}&se={season}&ep={episode}&detail_path={slug}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
        'x-client-info': '{"timezone":"Africa/Tunis"}'
    }
    
    print(f"[*] URL: {api_url}")
    print(f"[*] Headers: {json.dumps(headers, indent=2)}")
    
    if session.proxies:
        print(f"[*] Using Proxy: {session.proxies}")
    else:
        print("[!] NO PROXY CONFIGURED")
        
    try:
        response = session.get(api_url, headers=headers, timeout=10)
        
        print(f"\n[*] Status Code: {response.status_code}")
        print(f"[*] Response Headers: {dict(response.headers)}")
        
        print("\n[*] Response Content (First 500 chars):")
        print("-" * 40)
        print(response.text[:500])
        print("-" * 40)
        
        try:
            data = response.json()
            print("\n[+] SUCCESS! Got JSON response.")
            print(f"    Code: {data.get('code')}")
            if data.get('code') == 0:
                print(f"    Has Resource: {data.get('data', {}).get('hasResource')}")
                streams = data.get('data', {}).get('streams', [])
                print(f"    Streams found: {len(streams)}")
                if streams:
                    print(f"    First stream URL: {streams[0].get('url')}")
        except json.JSONDecodeError:
            print("[-] Failed to decode JSON")
            
    except Exception as e:
        print(f"\n[-] ERROR: {e}")

if __name__ == "__main__":
    debug_stream()
