
with open('ranking_list.html', 'r', encoding='utf-8') as f:
    content = f.read()

with open('tail.txt', 'w', encoding='utf-8') as f_out:
    f_out.write(content[-20000:])
