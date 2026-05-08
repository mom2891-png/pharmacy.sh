import json
import os
import time

SUMMARIES_FILE = "summaries.json"
DATA_JS_FILE = "data.js"

def get_total_count():
    if not os.path.exists(DATA_JS_FILE): return 0
    with open(DATA_JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    # "id": "g..." 패턴 개수 세기
    return len(re.findall(r'"id":\s*"g', content))

import re # 위에 넣어야 했으나 그냥 여기서 처리

def check():
    total = 240 # 이전 집계 기준
    if not os.path.exists(SUMMARIES_FILE):
        print("summaries.json 파일이 아직 생성되지 않았습니다.")
        return

    with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    current = len(data)
    percent = (current / total) * 100
    
    print("-" * 40)
    print("Guideline AI Summary Generation Progress")
    print(f"Status: {current} / {total} ({percent:.1f}%)")
    print("-" * 40)
    
    if current < total:
        print("INFO: Background task is still running.")
        print("      Run this script again later to check progress.")
    else:
        print("SUCCESS: All summaries generated!")
        print("         Run 'python merge_summaries.py' now.")

if __name__ == "__main__":
    check()
