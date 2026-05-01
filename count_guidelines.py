import re
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

ids = re.findall(r'"id":\s*"(g\d+)"', content)
print(f'Total guidelines: {len(ids)}')
