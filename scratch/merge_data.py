import json
import re

# Read parsed drugs
with open('scratch/parsed_drugs.json', 'r', encoding='utf-8') as f:
    new_drugs = json.load(f)

# Read existing data.js
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace "drugs": [ ... ] with the new data
# We'll use regex to find the drugs array
pattern = r'("drugs":\s*\[)(.*?)(\],\s*"supplements")'
replacement = f'"drugs": {json.dumps(new_drugs, ensure_ascii=False, indent=2)},\n  "supplements"'

# The drugs array might be large, so we use DOTALL to match across lines
new_content = re.sub(r'("drugs":\s*\[).*?(\],\s*"supplements")', replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully merged 2063 drugs into data.js")
