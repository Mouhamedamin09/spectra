""

 Test Search API and Extract Real Movie Data
"""
import requests
from bs4 import BeautifulSoup
import json
import re

def test_search_api():
    """Test the search API and extract movie data"""
    
    url = "https://moviebox.ph/web/searchResult?keyword=attack"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the NUXT_DATA script tag
        nuxt_data_tag = soup.find('script', {'id': '__NUXT_DAT__'})
        
        if nuxt_data_tag:
            # Parse the JSON data
            try:
                json_text = nuxt_data_tag.string
                # This is complex nested array format
                # We need to extract movie data from it
                print("[+] Found NUXT_DATA script")
                print(f"[*] Data length: {len(json_text)}")
                
                # Try to parse as JSON
                data = json.loads(json_text)
                print(f"[+] Parsed JSON, type: {type(data)}")
                
                # Save to file for analysis
                with open('nuxt_data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print("[+] Saved to nuxt_data.json")
                
            except Exception as e:
                print(f"[-] Error parsing JSON: {e}")
        
        # Also try to find movie data in HTML
        print("\n[*] Searching for movie cards in HTML...")
        
        # Look for movie titles in the HTML
        titles = soup.find_all('div', class_=re.compile('title|name', re.I))
        print(f"[*] Found {len(titles)} elements with 'title' or 'name' class")
        
        for i, title in enumerate(titles[:5]):
            print(f"  {i+1}. {title.get_text(strip=True)[:50]}")
        
        print("\n[+] Check search_test.json and nuxt_data.json for details")
        
    except Exception as e:
        print(f"[-] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_search_api()
