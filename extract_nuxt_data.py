import re
import json

with open('movie_detail_fresh.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find window.__NUXT__ data
match = re.search(r'window\.__NUXT__\s*=\s*(\{.*?\});?\s*</script>', content, re.DOTALL)
if match:
    data_str = match.group(1)
    print(f"Found Nuxt data (length: {len(data_str)})")
    
    # Try to parse it
    try:
        data = json.loads(data_str)
        print(json.dumps(data, indent=2))
    except:
        print("Failed to parse as JSON, showing raw:")
        print(data_str[:2000])
else:
    print("No window.__NUXT__ found")
    
# Also check for any .mp4 URLs that aren't trailers
mp4_urls = re.findall(r'https://[^"\']+\.mp4', content)
print(f"\nFound {len(mp4_urls)} total .mp4 URLs:")
for url in set(mp4_urls):
    print(f"  {url}")
