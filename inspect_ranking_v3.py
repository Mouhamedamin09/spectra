
with open('ranking_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

search_term = "Taxi Driver"
index = content.find(search_term)

if index != -1:
    print(f"Found '{search_term}' at index {index}")
    # Print 1000 chars before and after
    start = max(0, index - 1000)
    end = min(len(content), index + 1000)
    print(f"Context:\n{content[start:end]}")
else:
    print(f"'{search_term}' not found")
