import json
import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract JSON string
match = re.search(r'const\s+DB\s*=\s*(\{.*?\})\s*;?\s*$', content, re.DOTALL)
if match:
    json_str = match.group(1)
    db = json.loads(json_str)
    
    # Process hypertension content
    for item in db.get('guidelines', []):
        name = item.get('title', '')
        if '고혈압' in name and ('content' not in item or '원본 PDF 파일' in item.get('content', '원본 PDF 파일')):
            item['content'] = '고혈압의 일차 약제로는 A, C, D가 주로 권고됩니다. 동반 질환에 따라 선택합니다. <br><br>\n당뇨병 동반 시 <a class="smart-link" onclick="navigateTo(\'/drugs/d1\')\">Ramipril</a>(ACE 억제제) 사용 권장.<br>\n협심증이 있는 경우 <a class="smart-link" onclick="navigateTo(\'/drugs/d2\')\">Amlodipine</a>(CCB) 권장.'
    
    new_json_str = json.dumps(db, ensure_ascii=False, indent=2)
    new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Successfully updated data.js')
else:
    print('Failed to find JSON data in data.js')
