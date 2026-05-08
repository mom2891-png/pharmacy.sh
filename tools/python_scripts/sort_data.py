import json
import re
import os

# 파일 경로
DATA_JS_FILE = "data.js"

def hierarchical_sort_key(item):
    def get_nums(s):
        # "1. 고혈압" -> [1], "1.2. COPD" -> [1, 2]
        m = re.match(r'^([\d.]+)', str(s or ''))
        if m:
            parts = [x for x in m.group(1).split('.') if x]
            return [int(x) for x in parts]
        return [999999] # 숫자가 없는 경우 뒤로 보냄

    major = item.get("major", "")
    sub = item.get("sub", "기황") # 기타 방지
    title = item.get("title", "")
    
    return (get_nums(major), get_nums(sub), get_nums(title))

def sort_guidelines():
    if not os.path.exists(DATA_JS_FILE):
        print(f"Error: {DATA_JS_FILE} not found")
        return

    with open(DATA_JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 가이드라인 배열 추출 (generate_summaries.py와 동일 로직)
    try:
        idx = content.find('"guidelines"')
        if idx == -1: idx = content.find("guidelines")
        arr_start = content.index("[", idx)
        depth, pos, arr_end = 0, arr_start, -1
        while pos < len(content):
            if content[pos] == "[": depth += 1
            elif content[pos] == "]":
                depth -= 1
                if depth == 0:
                    arr_end = pos + 1
                    break
            pos += 1
        
        guidelines_str = content[arr_start:arr_end]
        guidelines = json.loads(guidelines_str)
        
        # 정렬 수행
        guidelines.sort(key=hierarchical_sort_key)
        
        # 새로운 JSON 생성
        new_guidelines_json = json.dumps(guidelines, ensure_ascii=False, indent=2)
        
        # 원본 파일 업데이트
        new_content = content[:arr_start] + new_guidelines_json + content[arr_end:]
        
        with open(DATA_JS_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        print(f"Successfully sorted {len(guidelines)} guidelines in data.js")
    except Exception as e:
        print(f"Error during sorting: {e}")

if __name__ == "__main__":
    sort_guidelines()
