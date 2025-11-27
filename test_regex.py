
import re

with open('tail.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: "slug-hash"
# The hash seems to be alphanumeric, around 11 chars.
# The slug part is lowercase with hyphens.
pattern = r'"([a-z0-9-]+-[a-zA-Z0-9]{7,})"'

matches = re.findall(pattern, content)

print(f"Found {len(matches)} matches")
for m in matches:
    print(m)
