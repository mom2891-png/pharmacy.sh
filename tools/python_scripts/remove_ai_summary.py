# -*- coding: utf-8 -*-
"""
data.js 에서 기존 aiSummary 필드를 모두 제거하는 스크립트
"""
import io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()

before = len(re.findall(r'"aiSummary"', content))

# ,\n    "aiSummary": { ... } 블록 제거 (중괄호 매칭)
def remove_ai_summary(text):
    result = []
    i = 0
    while i < len(text):
        # aiSummary 패턴 찾기
        match = re.search(r',\s*\n\s*"aiSummary"\s*:', text[i:])
        if not match:
            result.append(text[i:])
            break
        result.append(text[i:i + match.start()])
        # match 시작점 이후 첫 { 찾기
        seg = text[i + match.start() + len(match.group()):]
        brace_start = seg.index('{')
        depth = 0
        j = brace_start
        while j < len(seg):
            if seg[j] == '{':
                depth += 1
            elif seg[j] == '}':
                depth -= 1
                if depth == 0:
                    i = i + match.start() + len(match.group()) + j + 1
                    break
            j += 1
    return "".join(result)

content = remove_ai_summary(content)
after = len(re.findall(r'"aiSummary"', content))

with open("data.js", "w", encoding="utf-8") as f:
    f.write(content)

print(f"제거 전: {before}개, 제거 후: {after}개 aiSummary")
