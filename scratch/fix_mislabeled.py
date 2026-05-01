import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the drugs array
drugs_match = re.search(r'("drugs":\s*\[)(.*?)(\],\s*"supplements")', content, re.DOTALL)
drugs = json.loads("[" + drugs_match.group(2) + "]")

# Fix specific mislabeled sub-categories
for group in drugs:
    if group["sub"] == "[1. 순환기계질환]":
        # Check if items look like ACEi
        if any("pril" in (i["ingredient"] or "").lower() for i in group["items"]):
            group["sub"] = "ACEi (pril계)"
    if group["sub"] == "ARB (sartan)": # Ensure this is correct
        pass # Already fixed earlier but double check

# Save back to data.js
replacement = f'"drugs": {json.dumps(drugs, ensure_ascii=False, indent=2)},\n  "supplements"'
new_content = re.sub(r'("drugs":\s*\[).*?(\],\s*"supplements")', replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully fixed mislabeled sub-categories in data.js")
