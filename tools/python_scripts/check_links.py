import json

data = json.load(open('../parsed_guidelines.json', encoding='utf-8'))
with open('check.txt', 'w', encoding='utf-8') as f:
    for g in data:
        f.write(f"{g['title']} => {g.get('url', 'NONE')}\n")
