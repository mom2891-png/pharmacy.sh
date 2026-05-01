from PIL import Image
import os

img_path = r'C:\Users\Admin\.gemini\antigravity\brain\43bed001-7366-4e1f-bff8-22f3d90c533a\hira_hypertension_criteria_full_1777559393125.png'
pdf_path = r'c:\Users\Admin\.gemini\antigravity\scratch\pharmacy-info\assets\data\guidelines\고혈압_급여기준_2023.pdf'

try:
    image = Image.open(img_path)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # A4 사이즈에 최대한 맞춰서 고화질로 저장합니다.
    image.save(pdf_path, "PDF", resolution=100.0)
    print(f"Successfully converted and saved to {pdf_path}")
except Exception as e:
    print(f"Error during conversion: {e}")
