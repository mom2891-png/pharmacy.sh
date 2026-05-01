"""HWP -> PDF 변환 스크립트 (hwp5txt 텍스트 추출 → reportlab PDF 생성)"""
import os
import sys
import io

sys.stdout.reconfigure(encoding='utf-8')

GUIDELINES_DIR = 'assets/data/guidelines'


def extract_hwp_text(hwp_path):
    """hwp5txt로 텍스트를 추출합니다."""
    from hwp5.hwp5txt import main as hwp5txt_main
    
    old_argv = sys.argv
    old_stdout = sys.stdout
    
    # hwp5txt는 sys.stdout.buffer에 바이트를 쓰므로 BytesIO를 가진 가짜 stdout 필요
    buf = io.BytesIO()
    
    class FakeStdout:
        buffer = buf
        def write(self, s):
            if isinstance(s, bytes):
                buf.write(s)
            else:
                buf.write(s.encode('utf-8'))
        def flush(self):
            pass
    
    sys.stdout = FakeStdout()
    sys.argv = ['hwp5txt', hwp_path]
    
    try:
        hwp5txt_main()
    except SystemExit:
        pass
    
    text = buf.getvalue().decode('utf-8', errors='replace')
    sys.stdout = old_stdout
    sys.argv = old_argv
    
    return text


def text_to_pdf(text, pdf_path, title=""):
    """텍스트를 reportlab을 사용해 깔끔한 PDF로 변환합니다."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    # 한글 폰트 등록 (Windows 맑은 고딕)
    font_path = "C:/Windows/Fonts/malgun.ttf"
    font_bold_path = "C:/Windows/Fonts/malgunbd.ttf"
    
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('MalgunGothic', font_path))
        if os.path.exists(font_bold_path):
            pdfmetrics.registerFont(TTFont('MalgunGothicBold', font_bold_path))
        font_name = 'MalgunGothic'
        font_bold = 'MalgunGothicBold' if os.path.exists(font_bold_path) else 'MalgunGothic'
    else:
        font_name = 'Helvetica'
        font_bold = 'Helvetica-Bold'
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'KoreanTitle',
        parent=styles['Title'],
        fontName=font_bold,
        fontSize=16,
        spaceAfter=12,
        leading=22,
    )
    
    body_style = ParagraphStyle(
        'KoreanBody',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=10,
        leading=16,
        spaceAfter=4,
    )
    
    elements = []
    
    if title:
        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 10*mm))
    
    # 텍스트를 줄 단위로 처리
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            elements.append(Spacer(1, 3*mm))
            continue
        
        # XML 특수문자 이스케이프
        line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        try:
            elements.append(Paragraph(line, body_style))
        except Exception:
            # Paragraph 파싱 실패 시 일반 텍스트로 처리
            elements.append(Paragraph(line.encode('ascii', 'replace').decode(), body_style))
    
    doc.build(elements)


def update_data_js(old_path, new_path):
    """data.js에서 HWP 경로를 PDF 경로로 업데이트"""
    with open('data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(old_path, new_path)
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  📝 data.js 업데이트 완료")


if __name__ == '__main__':
    print("🔄 HWP → PDF 변환 시작\n")
    
    hwp_files = [f for f in os.listdir(GUIDELINES_DIR) if f.endswith('.hwp')]
    
    if not hwp_files:
        print("변환할 HWP 파일이 없습니다.")
        sys.exit(0)
    
    print(f"발견된 HWP 파일: {len(hwp_files)}개\n")
    
    for hwp_name in hwp_files:
        hwp_rel = f"{GUIDELINES_DIR}/{hwp_name}"
        pdf_name = hwp_name.rsplit('.', 1)[0] + '.pdf'
        pdf_rel = f"{GUIDELINES_DIR}/{pdf_name}"
        
        print(f"📄 {hwp_name}")
        
        # 1. 텍스트 추출
        print(f"  텍스트 추출 중...")
        text = extract_hwp_text(hwp_rel)
        
        if not text.strip():
            print(f"  ❌ 텍스트 추출 실패 (빈 내용)")
            continue
        
        print(f"  ✅ 텍스트 추출 성공 ({len(text)}자)")
        
        # 2. PDF 생성
        print(f"  PDF 생성 중...")
        try:
            text_to_pdf(text, pdf_rel, title=hwp_name.rsplit('.', 1)[0])
            print(f"  ✅ PDF 생성 완료: {pdf_name}")
        except Exception as e:
            print(f"  ❌ PDF 생성 실패: {e}")
            continue
        
        # 3. data.js 업데이트
        update_data_js(hwp_rel, pdf_rel)
        print()
    
    print("✅ 모든 변환 작업 완료!")
