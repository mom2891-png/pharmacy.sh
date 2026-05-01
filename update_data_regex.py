import re

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

def replacer(match):
    block = match.group(0)
    if '"content":' not in block:
        content_val = '고혈압의 일차 약제로는 A, C, D가 주로 권고됩니다. 동반 질환에 따라 선택합니다. <br><br>\\n당뇨병 동반 시 <a class=\\"smart-link\\" onclick=\\"navigateTo(\'/drugs/d1\')\\">Ramipril</a>(ACE 억제제) 사용 권장.<br>\\n협심증이 있는 경우 <a class=\\"smart-link\\" onclick=\\"navigateTo(\'/drugs/d2\')\\">Amlodipine</a>(CCB) 권장.'
        # insert at the end of properties
        block = re.sub(r'(\s*\})$', r',\n    "content": "{}"\1'.format(content_val), block)
    return block

new_text = re.sub(r'\{[^{}]*?"title":\s*"[^"]*고혈압[^"]*"[^{}]*?\}', replacer, text, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Updated data.js")
