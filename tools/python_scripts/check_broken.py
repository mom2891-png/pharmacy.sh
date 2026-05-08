import os
import json

broken = []
for f in os.listdir('public/data/guidelines'):
    path = os.path.join('public/data/guidelines', f)
    with open(path, 'rb') as fp:
        try:
            head = fp.read(10)
            if not head.startswith(b'%PDF'):
                broken.append(f)
        except Exception:
            pass

print(f"Total broken PDFs: {len(broken)}")

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
match = re.search(r'const\s+DB\s*=\s*(.*);\s*$', text, re.DOTALL)
if match:
    db = json.loads(match.group(1))
    for g in db.get('guidelines', []):
        url = g.get('url', '')
        if url:
            filename = url.split('/')[-1]
            if filename in broken:
                print(f"Broken: {filename} -> Original URL: ???")  # data.js might not have original URLs
