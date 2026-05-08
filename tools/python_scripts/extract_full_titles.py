import PyPDF2
import os
import re

def get_clean_title(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            if len(reader.pages) == 0: return None
            
            text = reader.pages[0].extract_text()
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            
            # 제목 추출을 위한 휴리스틱 (보통 상단에 위치)
            # 불필요한 저작권 정보나 페이지 번호 등은 제외
            candidate_lines = []
            for line in lines[:10]: # 상위 10줄 조사
                if 'Copyright' in line or 'Page' in line or 'p.' in line: continue
                if len(line) < 3: continue
                candidate_lines.append(line)
            
            if not candidate_lines: return None
            
            # 보통 첫 번째 혹은 두 번째 줄이 제목
            # 여러 줄에 걸쳐 있을 수 있으므로 합쳐서 반환
            return " ".join(candidate_lines[:2])
    except:
        return None

# 테스트용 파일 목록
test_ids = ["g151", "g18"]
files = {
    "g151": "assets/data/guidelines/정신질환_40 주의력결핍과다활동장애 (ADHD)_및 공존질환 -.pdf",
    "g18": "assets/data/guidelines/심혈관질환_5 부정맥_사용지침.pdf"
}

for gid, path in files.items():
    print(f"ID: {gid}")
    print(f"Current Title (in data.js): {gid} entry's broken title")
    print(f"Real Title from PDF: {get_clean_title(path)}")
    print("-" * 30)
