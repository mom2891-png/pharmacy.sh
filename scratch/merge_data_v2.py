import json
import re

with open('scratch/refined_drugs_v2.json', 'r', encoding='utf-8') as f:
    new_drugs = json.load(f)

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'("drugs":\s*\[).*?(\],\s*"supplements")'
replacement = f'"drugs": {json.dumps(new_drugs, ensure_ascii=False, indent=2)},\n  "supplements"'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully merged 1208 refined drugs (v2) into data.js")
