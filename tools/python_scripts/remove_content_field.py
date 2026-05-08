# -*- coding: utf-8 -*-
"""data.js 의 모든 guideline 항목에서 'content' 필드를 제거합니다."""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

# ,\n    "content": "..." 형태의 필드 한 줄 또는 여러 줄 제거
# JSON 문자열은 이스케이프된 따옴표를 포함할 수 있으므로 정규식으로 처리
before = len(re.findall(r'"content":', content))

# 문자열 값이 있는 content 필드 제거
# ,"content":"..." 또는 ,\n  "content":"..." (줄바꿈 포함된 문자열 포함)
pattern = r',\s*\n\s*"content":\s*"(?:[^"\\]|\\.)*"'
cleaned = re.sub(pattern, "", content, flags=re.DOTALL)

after = len(re.findall(r'"content":', cleaned))

with open("data.js", "w", encoding="utf-8") as f:
    f.write(cleaned)

print(f"제거 전: {before}개, 제거 후: {after}개 'content' 필드")
