
import re

with open('ranking_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the script content
match = re.search(r'window\.__NUXT__\s*=\s*(.*?);', content)
if match:
    data_str = match.group(1)
    print(f"Found Nuxt data string (length: {len(data_str)})")
    print(f"First 2000 chars:\n{data_str[:2000]}")
else:
    # Try finding it without the semicolon if it's the last thing in the script
    match = re.search(r'window\.__NUXT__\s*=\s*(.*)', content)
    if match:
        data_str = match.group(1).split('</script>')[0]
        print(f"Found Nuxt data string (length: {len(data_str)})")
        print(f"First 2000 chars:\n{data_str[:2000]}")
    else:
        print("Could not extract window.__NUXT__")
