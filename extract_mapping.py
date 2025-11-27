import re
import json

# Read tail.txt which has the JSON data from ranking list
with open('tail.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# The content has structured data with patterns like:
# "detail_path":"slug",..."subjectId":"1234"

# Try to find all occurrences
# Improved pattern to capture the association
mapping = {}

# Find patterns where detailPath and subjectId appear
# They're in the same object, so they should be relatively close

# Let's try a different approach: find all objects that have both
# Pattern: look for objects {...} that contain both fields
objects = re.findall(r'\{[^}]{100,2000}?\}', content)

for obj in objects:
    # Check if this object has both detailPath and subjectId
    detail_match = re.search(r'"detailPath":"([^"]+)"', obj)
    subject_match = re.search(r'"subjectId":"(\d{10,})"', obj)
    
    if detail_match and subject_match:
        slug = detail_match.group(1)
        sid = subject_match.group(1)
        mapping[slug] = sid

print(f"Created mapping with {len(mapping)} entries")

if mapping:
    print("\nSample mappings:")
    for i, (slug, sid) in enumerate(list(mapping.items())[:10]):
        print(f"  {slug} → {sid}")
    
    # Save to JSON
    with open('slug_to_id_mapping.json', 'w') as f:
        json.dump(mapping, f, indent=2)
    
    print(f"\n✓ Saved to slug_to_id_mapping.json")
else:
    print("\n✗ No mappings found. Let me try to show what we have:")
    # Show all distinct "detail" related fields
    details = re.findall(r'"detail[^"]*":"([^"]+)"', content)
    print(f"Found {len(details)} detail-related fields")
    if details:
        print("Samples:", details[:5])
    
    subjects = re.findall(r'"subjectId":"(\d+)"', content)
    print(f"Found {len(subjects)} subjectId fields")
    if subjects:
        print("Samples:", subjects[:5])
