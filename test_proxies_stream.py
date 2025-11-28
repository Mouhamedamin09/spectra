import requests
import json
import os

def test_proxies():
    print("=" * 60)
    print("TESTING PROXIES AGAINST STREAMING API")
    print("=" * 60)
    
    # Using a known movie
    slug = "al-sada-al-afadel-arabic-uhxaFvYCtm4"
    subject_id = "3661482488930750752"
    
    api_url = f"https://lok-lok.cc/wefeed-h5-bff/web/subject/play?subjectId={subject_id}&se=0&ep=0&detail_path={slug}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://lok-lok.cc/spa/videoPlayPage/movies/{slug}?id={subject_id}&type=/movie/detail&lang=en',
        'x-client-info': '{"timezone":"Africa/Tunis"}'
    }
    
    # Read proxies
    with open('proxy_list.txt', 'r') as f:
        proxies = [line.strip() for line in f if line.strip()]
        
    working_proxies = []
    
    for proxy_url in proxies:
        print(f"\nTesting: {proxy_url}")
        
        session = requests.Session()
        session.proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        
        try:
            response = session.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 0:
                    print("✅ WORKS! (Code 0)")
                    working_proxies.append(proxy_url)
                elif data.get('code') == 403:
                    print(f"❌ BLOCKED: {data.get('message')}")
                else:
                    print(f"⚠️  Unknown response: {data}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"   Content: {response.text[:100]}")
                
        except Exception as e:
            print(f"❌ Connection Error: {e}")
            
    print("\n" + "=" * 60)
    print(f"Found {len(working_proxies)} working proxies for streaming:")
    for p in working_proxies:
        print(p)
        
    # Save working proxies
    if working_proxies:
        with open('working_proxies_stream.txt', 'w') as f:
            for p in working_proxies:
                f.write(p + "\n")
        print("\nSaved to working_proxies_stream.txt")

if __name__ == "__main__":
    test_proxies()
