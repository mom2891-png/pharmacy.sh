import PyPDF2
import os

def extract_pdf_title(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            if len(reader.pages) > 0:
                first_page_text = reader.pages[0].extract_text()
                # 첫 200자 정도에서 제목으로 보일만한 부분을 추출 (보통 줄바꿈으로 구분됨)
                lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
                return " ".join(lines[:3]) # 상위 3줄 정도를 제목 후보로 반환
    except Exception as e:
        return f"Error: {e}"
    return "Unknown"

# g151의 실제 경로 확인
pdf_file = "assets/data/guidelines/정신질환_40 주의력결핍과다활동장애 (ADHD)_및 공존질환 -.pdf"
print(f"File: {pdf_file}")
print(f"Extracted Title: {extract_pdf_title(pdf_file)}")
