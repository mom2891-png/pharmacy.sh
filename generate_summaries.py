# -*- coding: utf-8 -*-
"""
AI 약사 요약 생성 스크립트
- Gemini API (google-genai) 를 사용하여 PDF 원문 기반 약사 요약 생성
- summaries.json 에 순차 저장 (중단 후 재개 가능)
"""

import io
import json
import os
import re
import sys
import time

# stdout 인코딩 UTF-8 강제
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
    print("google-genai 로드 완료")
except ImportError:
    print("ERROR: pip install google-genai")
    sys.exit(1)

try:
    import fitz
    PDF_AVAILABLE = True
    print("PyMuPDF 로드 완료")
except ImportError:
    PDF_AVAILABLE = False
    print("WARNING: PyMuPDF 없음 -> 메타데이터만 사용")

# ── 설정 ──────────────────────────────────────────────────────────
GEMINI_API_KEY  = "AIzaSyATdMktBCEohBoZbQi2Gm_RDY5LkCxSTgE"
SUMMARIES_FILE  = "summaries.json"
DATA_JS_FILE    = "data.js"
MAX_PDF_PAGES   = 8
MAX_TEXT_CHARS  = 40000
REQUEST_DELAY   = 1   # 초 (속도 개선)

client = genai.Client(api_key=GEMINI_API_KEY)

# ── data.js 파싱 ───────────────────────────────────────────────────
def parse_guidelines():
    with open(DATA_JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    idx = content.find('"guidelines"')
    if idx == -1:
        idx = content.find("guidelines")
    arr_start = content.index("[", idx)
    depth, pos, arr_end = 0, arr_start, -1
    while pos < len(content):
        if content[pos] == "[":
            depth += 1
        elif content[pos] == "]":
            depth -= 1
            if depth == 0:
                arr_end = pos + 1
                break
        pos += 1
    return json.loads(content[arr_start:arr_end])

# ── PDF 텍스트 추출 ────────────────────────────────────────────────
def extract_pdf_text(url: str):
    if not PDF_AVAILABLE or not url or not url.strip():
        return None
    path = url.strip()
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        if not f.read(10).startswith(b"%PDF"):
            return None
    try:
        doc = fitz.open(path)
        text = ""
        for i, page in enumerate(doc):
            if i >= MAX_PDF_PAGES:
                break
            text += page.get_text("text")
        doc.close()
        return text[:MAX_TEXT_CHARS] if text.strip() else None
    except Exception as e:
        print(f"  [PDF 오류] {e}")
        return None

# ── 프롬프트 생성 ──────────────────────────────────────────────────
def build_prompt(g: dict, pdf_text) -> str:
    meta = (
        f"제목: {g.get('title','-')}\n"
        f"발행처: {g.get('publisher','-')} ({g.get('year','-')}년)\n"
        f"질환 분류: {g.get('major','-')} > {g.get('sub','-')}"
    )

    base = (
        "당신은 한국 임상약사입니다. "
        "아래 가이드라인을 분석하여 임상약사에게 실질적으로 유용한 약물치료 정보를 JSON으로 요약하세요.\n\n"
        "반드시 다음 규칙을 지키세요:\n"
        "1. firstLine에는 구체적인 '약물 이름(성분명 또는 약물 계열 + 대표 성분명)'을 반드시 포함하세요.\n"
        "   예: 'CCB (Amlodipine, Nifedipine)', 'ACE 억제제 (Ramipril, Lisinopril)', 'ARB (Valsartan, Losartan)', '이뇨제 (Hydrochlorothiazide)', 'β차단제 (Bisoprolol)'\n"
        "   약물명 없이 비약물 요법, 생활습관, 목표치만 적는 것은 금지합니다.\n"
        "2. monitoring에는 구체적인 '검사 항목 및 수치 기준'을 포함하세요.\n"
        "   예: '혈압 목표: 140/90 mmHg 미만', '신기능 (SCr, BUN, eGFR) 정기 확인', '전해질 (K+) 모니터링'\n"
        "3. cautions에는 구체적인 '약물 금기증 또는 약물 상호작용'을 포함하세요.\n"
        "   예: 'ACE 억제제: 임신 중 금기', 'NSAID 병용 시 신독성 및 혈압 상승 주의'\n"
        "4. special에는 특수 환자군별 권장 약물을 구체적으로 작성하세요.\n"
        "   예: '당뇨 동반 시 ACE 억제제 또는 ARB 우선 선택', '만성콩팥병: RAS 차단제 권고'\n\n"
    )

    if pdf_text:
        body = (
            f"[가이드라인 정보]\n{meta}\n\n"
            f"[원문 발췌]\n{pdf_text}\n\n"
        )
    else:
        body = f"[가이드라인 정보 (메타데이터)]\n{meta}\n\n"

    instruction = (
        "위 내용을 바탕으로 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):\n"
        '{\n'
        '  "overview": "이 가이드라인의 핵심 약물치료 방향 1-2줄 (약물명 또는 약물계열 포함)",\n'
        '  "firstLine": ["약물계열 (성분명1, 성분명2) - 적응증 또는 특징", "두번째 약제 항목"],\n'
        '  "monitoring": ["검사항목: 목표 수치 또는 기준", "두번째 모니터링 항목"],\n'
        '  "cautions": ["약물명 또는 계열: 금기·주의 이유", "두번째 주의사항"],\n'
        '  "special": "환자군별 선호 약제 (예: 당뇨→ACEi/ARB, 심부전→ACEi+BB+이뇨제 등)"\n'
        '}'
    )
    return base + body + instruction

# ── Gemini 호출 ────────────────────────────────────────────────────
def call_gemini(prompt: str):
    for attempt in range(3):
        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            raw = resp.text.strip()
            raw = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"^```\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```\s*$", "", raw, flags=re.MULTILINE)
            raw = raw.strip()
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"  [JSON 파싱 실패 {attempt+1}] {e}")
            time.sleep(2)
        except Exception as e:
            print(f"  [API 오류 {attempt+1}] {e}")
            time.sleep(6)
    return None

# ── 메인 ──────────────────────────────────────────────────────────
def main():
    summaries = {}
    if os.path.exists(SUMMARIES_FILE):
        with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
            summaries = json.load(f)
        print(f"기존 결과 로드: {len(summaries)}개")

    guidelines = parse_guidelines()
    total = len(guidelines)
    print(f"전체 가이드라인: {total}개 / 이미 완료: {len(summaries)}개\n")

    for i, g in enumerate(guidelines):
        gid   = g.get("id")
        title = g.get("title", "-")

        if gid in summaries:
            print(f"[{i+1}/{total}] SKIP: {gid} - {title}")
            continue

        print(f"[{i+1}/{total}] 처리: {gid} - {title}")

        url      = g.get("url", "")
        pdf_text = extract_pdf_text(url)
        if pdf_text:
            print(f"  PDF 추출: {len(pdf_text)} 글자")
        else:
            print(f"  PDF 없음 -> 메타데이터 사용")

        prompt  = build_prompt(g, pdf_text)
        summary = call_gemini(prompt)

        if summary:
            summaries[gid] = summary
            with open(SUMMARIES_FILE, "w", encoding="utf-8") as f:
                json.dump(summaries, f, ensure_ascii=False, indent=2)
            print(f"  OK [{len(summaries)}/{total}]")
        else:
            print(f"  FAIL: {gid}")

        time.sleep(REQUEST_DELAY)

    print(f"\n완료! {len(summaries)}개 -> {SUMMARIES_FILE}")

if __name__ == "__main__":
    main()
