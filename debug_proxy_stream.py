import requests
from session_manager import get_session_manager

def debug_proxy_stream():
    print("=" * 60)
    print("DEBUGGING PROXY STREAM API")
    print("=" * 60)
    
    # URL from your logs
    video_url = "https://bcdnxw.hakunaymatata.com/resource/26085d1c58e6c8a6a5fdc10958024d8a.mp4?sign=90d5b04a1df18c308e448cc0b0f16334&t=1764326554"
    
    session_manager = get_session_manager()
    session = session_manager.get_session()
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://lok-lok.cc/',
        'Range': 'bytes=0-1024'  # Request first 1KB
    }
    
    print(f"[*] Fetching video: {video_url[:60]}...")
    print(f"[*] Headers: {headers}")
    
    if session.proxies:
        print(f"[*] Using Proxy: {session.proxies}")
    else:
        print("[!] NO PROXY CONFIGURED")
        
    try:
        response = session.get(video_url, headers=headers, stream=True, timeout=10)
        
        print(f"\n[*] Status Code: {response.status_code}")
        print(f"[*] Response Headers: {dict(response.headers)}")
        
        # Read a small chunk
        chunk = next(response.iter_content(chunk_size=1024))
        print(f"\n[+] SUCCESS! Got chunk of size: {len(chunk)} bytes")
        print(f"    First 20 bytes: {chunk[:20]}")
        
    except Exception as e:
        print(f"\n[-] ERROR: {e}")

if __name__ == "__main__":
    debug_proxy_stream()
