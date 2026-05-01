import re

with open('data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

external_list = []
current_id = None
current_title = None

for line in lines:
    id_match = re.search(r'"id":\s*"(g\d+)"', line)
    if id_match:
        current_id = id_match.group(1)
    
    title_match = re.search(r'"title":\s*"(.*?)"', line)
    if title_match:
        current_title = title_match.group(1)
        
    url_match = re.search(r'"url":\s*"(http.*?)"', line)
    if url_match and current_id:
        url = url_match.group(1)
        external_list.append({
            "id": current_id,
            "title": current_title,
            "url": url
        })

print(f"Total External Links: {len(external_list)}")
for item in external_list:
    print(f"[{item['id']}] {item['title']} | URL: {item['url']}")
