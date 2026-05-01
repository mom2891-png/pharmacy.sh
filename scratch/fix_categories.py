import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the drugs array
drugs_match = re.search(r'("drugs":\s*\[)(.*?)(\],\s*"supplements")', content, re.DOTALL)
if not drugs_match:
    print("Drugs array not found")
    exit()

drugs = json.loads("[" + drugs_match.group(2) + "]")

# Define mapping for unnumbered categories to numbered ones
# (Based on common pharmaceutical classifications)
mapping = {
    "[눈]": "[10. 눈/귀/치과/구강 약물]",
    "[귀]": "[10. 눈/귀/치과/구강 약물]",
    "[치과]": "[10. 눈/귀/치과/구강 약물]",
    "[구강]": "[10. 눈/귀/치과/구강 약물]",
    "[피부]": "[11. 피부 질환]",
    "[비뇨기]": "[12. 비뇨기 질환]",
    "[신경계]": "[3. 중추신경계 질환]", # Example
    # Add more as needed based on the PDF content
}

for drug in drugs:
    major = drug.get("major", "")
    if major in mapping:
        drug["major"] = mapping[major]
    
    # If it's something like "[눈]" but not in mapping, we should still try to prefix it or merge it
    # Rule: If it doesn't start with "[Number.", it's a candidate for merging.
    if not re.match(r'^\[\d+\.', major):
        # We'll try to find a parent major that matches keywords
        if "눈" in major or "귀" in major or "치과" in major or "구강" in major:
            drug["major"] = "[10. 눈/귀/치과/구강 약물]"
        elif "피부" in major:
            drug["major"] = "[11. 피부 질환]"

# Save back to data.js
replacement = f'"drugs": {json.dumps(drugs, ensure_ascii=False, indent=2)},\n  "supplements"'
new_content = re.sub(r'("drugs":\s*\[).*?(\],\s*"supplements")', replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully merged categories in data.js")
