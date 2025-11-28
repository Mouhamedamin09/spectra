import requests
import json
from session_manager import get_session_manager

def debug_collection():
    print("=" * 60)
    print("DEBUGGING COLLECTION API")
    print("=" * 60)
    
    collection_id = "9028172287106864712"
    
    session_manager = get_session_manager()
    session = session_manager.get_session()
    
    # Collection API
    api_url = 'https://moviebox.ph/wefeed-h5-bff/web/ranking-list/content'
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://moviebox.ph/ranking-list/Kfiq8uLrEM2?id={collection_id}&page_from=more_SUBJECTS_MOVIE',
        'x-client-info': '{"timezone":"Africa/Tunis"}'
    }
    
    params = {
        'id': collection_id,
        'page': 1,
        'perPage': 20
    }
    
    print(f"[*] URL: {api_url}")
    print(f"[*] Headers: {json.dumps(headers, indent=2)}")
    print(f"[*] Params: {params}")
    
    if session.proxies:
        print(f"[*] Using Proxy: {session.proxies}")
    else:
        print("[!] NO PROXY CONFIGURED")
        
    try:
        response = session.get(api_url, headers=headers, params=params, timeout=10)
        
        print(f"\n[*] Status Code: {response.status_code}")
        print(f"[*] Response Headers: {dict(response.headers)}")
        
        print("\n[*] Response Content (First 500 chars):")
        print("-" * 40)
        print(response.text[:500])
        print("-" * 40)
        
        data = response.json()
        print("\n[+] SUCCESS! Got JSON response.")
        print(f"    Code: {data.get('code')}")
        print(f"    Data keys: {list(data.get('data', {}).keys())}")
        
    except Exception as e:
        print(f"\n[-] ERROR: {e}")

if __name__ == "__main__":
    debug_collection()
