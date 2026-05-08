import requests
import json

data = json.load(open('parsed_guidelines.json', encoding='utf-8'))
for g in data[:5]:
    url = g.get('url')
    if not url: continue
    print(f"URL: {url}")
    try:
        r = requests.head(url, allow_redirects=True, timeout=5)
        print(f"Content-Disposition: {r.headers.get('Content-Disposition')}")
        print(f"Content-Type: {r.headers.get('Content-Type')}")
    except Exception as e:
        print(e)
    print("-" * 30)
