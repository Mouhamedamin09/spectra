
import requests
from bs4 import BeautifulSoup
import re
import json
import time

def get_stream_url(page_url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(page_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the meta tag with property="og:video:url"
        video_meta = soup.find('meta', property='og:video:url')
        
        if video_meta and video_meta.get('content'):
            video_url = video_meta['content']
            return video_url
        else:
            return None
            
    except Exception as e:
        print(f"[-] Error fetching {page_url}: {e}")
        return None

def check_quality_variants(original_url):
    # Common patterns: -ld.mp4, -sd.mp4, -hd.mp4
    base_url = original_url
    current_quality = "unknown"
    
    # Try to identify current quality suffix
    match = re.search(r'-(ld|sd|hd)\.mp4$', original_url)
    if match:
        current_quality = match.group(1)
        base_url = original_url[:match.start()]
    elif original_url.endswith('.mp4'):
         base_url = original_url[:-4]
    
    qualities = ['ld', 'sd', 'hd']
    available_qualities = {}
    
    for q in qualities:
        variant_url = f"{base_url}-{q}.mp4"
        try:
            r = requests.head(variant_url, timeout=5)
            if r.status_code == 200:
                available_qualities[q] = variant_url
        except:
            pass
            
    return available_qualities

def main():
    print("[*] Starting batch scraper...")
    
    # 1. Read ranking_list.html
    try:
        with open('ranking_list.html', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print("[-] ranking_list.html not found. Please run the research steps first.")
        return

    # 2. Extract slugs
    # Pattern: "slug-hash" (e.g., "natural-disaster-arabic-Iu6LI2yUkW2")
    # Exclude the build ID which looks similar but usually doesn't have the movie-name structure
    pattern = r'"([a-z0-9-]+-[a-zA-Z0-9]{7,})"'
    matches = re.findall(pattern, content)
    
    # Filter matches - simple heuristic: length > 15 usually implies a movie slug with title
    # Also filter out the known build ID if possible, or just rely on length/structure
    movie_slugs = set()
    for m in matches:
        if len(m) > 20: # Most movie slugs are quite long
            movie_slugs.add(m)
            
    print(f"[*] Found {len(movie_slugs)} potential movie slugs.")
    
    movies_data = []
    
    # 3. Iterate and scrape
    for i, slug in enumerate(movie_slugs):
        print(f"[{i+1}/{len(movie_slugs)}] Processing: {slug}")
        
        detail_url = f"https://moviebox.ph/detail/{slug}"
        video_url = get_stream_url(detail_url)
        
        if video_url:
            print(f"    [+] Found video: {video_url}")
            qualities = check_quality_variants(video_url)
            print(f"    [+] Qualities: {', '.join(qualities.keys())}")
            
            movie_entry = {
                "slug": slug,
                "detail_url": detail_url,
                "default_video_url": video_url,
                "qualities": qualities
            }
            movies_data.append(movie_entry)
        else:
            print("    [-] No video found.")
        
        # Be nice to the server
        time.sleep(1)

    # 4. Save to JSON
    with open('movies.json', 'w', encoding='utf-8') as f:
        json.dump(movies_data, f, indent=4)
        
    print(f"[*] Done. Saved {len(movies_data)} movies to movies.json")

if __name__ == "__main__":
    main()
