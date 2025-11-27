import re
import json

# Read the tail.txt that has the ranking list data
with open('tail.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract a few subject IDs and their slugs
# Pattern: "subjectId":number and nearby "detail_path":"slug"
pattern = r'"subjectId":"(\d+)"'
matches = re.findall(pattern, content)

print(f"Found {len(set(matches))} unique subject IDs:")
for sid in list(set(matches))[:5]:
    print(f"  {sid}")
