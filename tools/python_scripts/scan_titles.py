import json
import re

def find_suspicious_titles(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # DB.guidelines = [ ... ] 부분을 찾아서 파싱 (정규식 사용)
    # 간단하게 각 가이드라인 객체를 하나씩 찾음
    guidelines = re.findall(r'\{[^{}]*?"id":\s*"(g\d+)"[^{}]*?\}', content, re.DOTALL)
    
    suspicious = []
    for g_str in guidelines:
        gid_match = re.search(r'"id":\s*"(g\d+)"', g_str)
        title_match = re.search(r'"title":\s*"(.*?)"', g_str)
        
        if gid_match and title_match:
            gid = gid_match.group(1)
            title = title_match.group(1)
            
            # 의심 조건: 5자 미만, '및'으로 시작, '-'로 끝남, 공백으로 시작 등
            if len(title) < 5 or title.startswith('및') or title.startswith(' 및') or title.endswith('-') or title.endswith(' '):
                suspicious.append((gid, title))
                
    return suspicious

suspicious_list = find_suspicious_titles('data.js')
print(f"Total suspicious titles found: {len(suspicious_list)}")
for gid, title in suspicious_list:
    print(f"ID: {gid} | Title: [{title}]")
