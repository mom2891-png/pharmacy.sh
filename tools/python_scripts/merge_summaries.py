"""
summaries.json → data.js 병합 스크립트
generate_summaries.py 실행 후 이 스크립트를 실행하세요.
"""

import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SUMMARIES_FILE = "summaries.json"
DATA_JS_FILE = "data.js"


def load_summaries():
    if not os.path.exists(SUMMARIES_FILE):
        print(f"ERROR: {SUMMARIES_FILE} 파일이 없습니다. generate_summaries.py를 먼저 실행하세요.")
        return {}
    with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def merge_into_datajs(summaries: dict):
    with open(DATA_JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    merged_count = 0

    for gid, summary in summaries.items():
        # 해당 id 객체가 이미 aiSummary를 갖고 있으면 스킵
        # 패턴: "id": "g123", ... (찾아서 해당 객체 끝에 aiSummary 추가)

        # aiSummary가 없는 경우에만 삽입
        check_pattern = rf'"id":\s*"{re.escape(gid)}"[^}}]*"aiSummary"'
        if re.search(check_pattern, content, re.DOTALL):
            continue  # 이미 존재

        summary_json = json.dumps(summary, ensure_ascii=False)

        # "id": "g123" 뒤에 오는 객체 닫는 } 바로 전에 삽입
        # 전략: id 필드를 찾고 그 블록의 닫는 }를 찾아 aiSummary 추가
        id_pattern = rf'("id":\s*"{re.escape(gid)}")'

        def insert_summary(m):
            nonlocal merged_count
            merged_count += 1
            return m.group(0)

        # id 위치 찾기
        id_match = re.search(rf'"id":\s*"{re.escape(gid)}"', content)
        if not id_match:
            print(f"  WARNING: id={gid} 를 data.js에서 찾을 수 없음")
            continue

        # 해당 id 이후 첫 번째 } (객체 닫힘) 찾기 - 중첩 고려
        start = id_match.start()
        # 이 id가 속한 객체의 시작 { 를 역방향으로 찾기
        obj_start = content.rfind("{", 0, start)

        # obj_start에서 매칭되는 } 찾기
        depth = 0
        pos = obj_start
        obj_end = -1
        while pos < len(content):
            if content[pos] == "{":
                depth += 1
            elif content[pos] == "}":
                depth -= 1
                if depth == 0:
                    obj_end = pos
                    break
            pos += 1

        if obj_end == -1:
            print(f"  WARNING: id={gid} 객체 끝을 찾을 수 없음")
            continue

        # } 바로 앞에 aiSummary 필드 삽입
        insert_str = f',\n    "aiSummary": {summary_json}'
        content = content[:obj_end] + insert_str + content[obj_end:]
        merged_count += 1
        print(f"  [OK] {gid} 병합 완료")

    with open(DATA_JS_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"\n[DONE] {merged_count}개 요약이 data.js에 병합되었습니다.")


if __name__ == "__main__":
    summaries = load_summaries()
    if summaries:
        print(f"summaries.json 로드: {len(summaries)}개")
        merge_into_datajs(summaries)
