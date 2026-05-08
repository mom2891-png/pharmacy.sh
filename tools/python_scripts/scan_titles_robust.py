import re

with open('data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_id = None
for i, line in enumerate(lines):
    # ID 찾기
    id_match = re.search(r'"id":\s*"(g\d+)"', line)
    if id_match:
        current_id = id_match.group(1)
        
    # Title 찾기
    title_match = re.search(r'"title":\s*"(.*?)"', line)
    if title_match and current_id:
        title = title_match.group(1)
        # 의심 조건
        if len(title) < 5 or title.startswith('및') or title.startswith(' 및') or title.endswith('-') or title.endswith(' '):
            print(f"Line {i+1} | ID: {current_id} | Title: [{title}]")
