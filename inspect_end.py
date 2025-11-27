
with open('ranking_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File length: {len(content)}")
print("Last 5000 chars:")
print(content[-5000:])
