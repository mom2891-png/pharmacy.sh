import json
import re

with open('scratch/refined_drugs_v4.json', 'r', encoding='utf-8') as f:
    drugs = json.load(f)

# Apply category merging logic
mapping = {
    "[눈]": "[10. 눈/귀/치과/구강 약물]",
    "[귀]": "[10. 눈/귀/치과/구강 약물]",
    "[치과]": "[10. 눈/귀/치과/구강 약물]",
    "[구강]": "[10. 눈/귀/치과/구강 약물]",
    "[피부]": "[11. 피부 질환]",
    "[비뇨기]": "[12. 비뇨기 질환]",
}

for drug in drugs:
    major = drug.get("major", "")
    if major in mapping:
        drug["major"] = mapping[major]
    elif not re.match(r'^\[\d+\.', major):
        if any(k in major for k in ["눈", "귀", "치과", "구강"]):
            drug["major"] = "[10. 눈/귀/치과/구강 약물]"
        elif "피부" in major:
            drug["major"] = "[11. 피부 질환]"

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'("drugs":\s*\[).*?(\],\s*"supplements")'
replacement = f'"drugs": {json.dumps(drugs, ensure_ascii=False, indent=2)},\n  "supplements"'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully merged 1135 refined drugs (v4) with unified categories into data.js")
