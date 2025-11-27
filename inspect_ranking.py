
with open('ranking_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File length: {len(content)}")

search_term = "Taxi Driver"
index = content.find(search_term)

if index != -1:
    print(f"Found '{search_term}' at index {index}")
    start = max(0, index - 500)
    end = min(len(content), index + 500)
    print(f"Context:\n{content[start:end]}")
else:
    print(f"'{search_term}' not found")

nuxt_index = content.find("__NUXT__")
if nuxt_index != -1:
    print(f"Found '__NUXT__' at index {nuxt_index}")
    start = max(0, nuxt_index - 100)
    end = min(len(content), nuxt_index + 1000) # Print a chunk of it
    print(f"Nuxt Context:\n{content[start:end]}")
else:
    print("'__NUXT__' not found")
