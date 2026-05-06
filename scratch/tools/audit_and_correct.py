import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the drugs array
drugs_match = re.search(r'("drugs":\s*\[)(.*?)(\],\s*"supplements")', content, re.DOTALL)
drugs = json.loads("[" + drugs_match.group(2) + "]")

# Pharmacological Mapping for Correction
corrections = {
    "Fluvastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Pitavastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Lovastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Atorvastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Rosuvastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Simvastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Pravastatin": {"minor": "고지혈증 치료제", "sub": "HMG-CoA (Statin)", "major": "[1. 순환기계질환]"},
    "Spironolactone": {"minor": "이뇨제", "sub": "칼륨보존 이뇨제", "major": "[1. 순환기계질환]"},
    "Furosemide": {"minor": "이뇨제", "sub": "Loop 이뇨제", "major": "[1. 순환기계질환]"},
    "Torsemide": {"minor": "이뇨제", "sub": "Loop 이뇨제", "major": "[1. 순환기계질환]"},
    "Hydrochlorothiazide": {"minor": "이뇨제", "sub": "Thiazide계", "major": "[1. 순환기계질환]"},
}

for group in drugs:
    for item in group["items"]:
        ing = item["ingredient"]
        if ing in corrections:
            group["minor"] = corrections[ing]["minor"]
            group["sub"] = corrections[ing]["sub"]
            group["major"] = corrections[ing]["major"]

# Also handle cases where "minor" might be stuck from previous page
# We'll use a keyword-based cleanup for the entire dataset
for group in drugs:
    # If items contain statins, minor MUST be 고지혈증
    if any("vastatin" in (i["ingredient"] or "").lower() for i in group["items"]):
        group["minor"] = "고지혈증 치료제"
        group["major"] = "[1. 순환기계질환]"
    # If items contain "mide" or "thiazide", likely diuretics
    if any(re.search(r'(mide|thiazide|actone|spironolactone)', (i["ingredient"] or "").lower()) for i in group["items"]):
        group["minor"] = "이뇨제"
        group["major"] = "[1. 순환기계질환]"

# Save back to data.js
replacement = f'"drugs": {json.dumps(drugs, ensure_ascii=False, indent=2)},\n  "supplements"'
new_content = re.sub(r'("drugs":\s*\[).*?(\],\s*"supplements")', replacement, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully corrected drug categories based on pharmacological groups.")
