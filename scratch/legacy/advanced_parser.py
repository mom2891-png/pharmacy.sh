import re
import json

def is_english(s):
    # Contains letters, no Korean, and is not just a single letter/number
    return bool(re.search(r'[a-zA-Z]', s)) and not bool(re.search(r'[가-힣]', s)) and len(s) > 1

def is_korean(s):
    return bool(re.search(r'[가-힣]', s))

def parse():
    with open('scratch/full_pdf_text.txt', 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]
    
    drugs = []
    current_major = "기타"
    current_minor = "미분류"
    current_sub = "일반"
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # 1. Major Category: [1. ...]
        if line.startswith('[') and line.endswith(']'):
            current_major = line
            i += 1
            if i < len(lines):
                current_minor = lines[i] # Next line is usually Minor
                i += 1
            continue
            
        # 2. Heuristic for Category Header (Minor or Sub)
        # If it's short and contains symbols like ( ), / , or is mixed but short
        if not is_english(line) and len(line) < 25 and not line[0].isdigit():
             # Check if it looks like a sub-category (e.g. "ACEi (pril)")
             if '(' in line or '계' in line or '차단제' in line or '억제제' in line or '치료제' in line:
                 if '치료제' in line:
                     current_minor = line
                 else:
                     current_sub = line
             else:
                 # If it's not a drug name, maybe it's a sub
                 if not is_korean(line) and not is_english(line):
                     pass # ignore junk
                 else:
                     # This might be a sub or a drug. 
                     # If the next few lines are English names, this is likely a Sub.
                     looks_like_sub = False
                     for j in range(1, 4):
                         if i+j < len(lines) and is_english(lines[i+j]):
                             looks_like_sub = True
                             break
                     if looks_like_sub:
                         current_sub = line
                     else:
                         # It's a drug item (but we'll handle that in the item block)
                         pass
        
        # 3. Drug Item Block (English list then Korean list)
        if is_english(line):
            eng_list = []
            kor_list = []
            
            # Collect English names
            while i < len(lines) and (is_english(lines[i]) or re.match(r'^[a-zA-Z0-9\-\s\+]+$', lines[i])):
                eng_list.append(lines[i])
                i += 1
            
            # Collect Korean names (matching count or until next category/english)
            while i < len(lines) and is_korean(lines[i]) and not ('치료제' in lines[i] or lines[i].startswith('[')):
                kor_list.append(lines[i])
                i += 1
            
            # Zip them (pad if lengths differ)
            max_len = max(len(eng_list), len(kor_list))
            items = []
            for k in range(max_len):
                eng = eng_list[k] if k < len(eng_list) else ""
                kor = kor_list[k] if k < len(kor_list) else ""
                if eng or kor:
                    items.append({"ingredient": eng, "reference": kor, "image": ""})
            
            if items:
                drugs.append({
                    "id": f"drug_{len(drugs)+1}",
                    "major": current_major,
                    "minor": current_minor,
                    "sub": current_sub,
                    "items": items
                })
            continue

        i += 1
        
    return drugs

parsed_drugs = parse()
print(f"Successfully parsed {len(parsed_drugs)} categories with {sum(len(d['items']) for d in parsed_drugs)} drugs.")

with open('scratch/parsed_drugs.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_drugs, f, ensure_ascii=False, indent=2)
