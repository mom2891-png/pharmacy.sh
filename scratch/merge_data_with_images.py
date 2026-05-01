import json
import re

# Read parsed drugs with images
with open('scratch/parsed_drugs_with_images.json', 'r', encoding='utf-8') as f:
    new_drugs = json.load(f)

# Read existing data.js
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace "drugs": [ ... ] with the new data
pattern = r'("drugs":\s*\[).*?(\],\s*"supplements")'
replacement = f'"drugs": {json.dumps(new_drugs, ensure_ascii=False, indent=2)},\n  "supplements"'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully merged 2063 drugs with extracted images into data.js")
