import re

def fix_titles(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. g18 수정
    content = re.sub(
        r'("id":\s*"g18".*?"title":\s*").*?(")',
        r'\1 2022 대한부정맥학회 심방세동 환자에서 비타민 K 비의존성 경구용 항응고제 (NOAC) 사용 지침\2',
        content, flags=re.DOTALL
    )
    
    # 2. g151 수정
    content = re.sub(
        r'("id":\s*"g151".*?"title":\s*").*?(")',
        r'\1주의력결핍 과잉행동장애 한국형 치료 권고안 개정안(I) - 서론, 임상양상 및 공존질환 -\2',
        content, flags=re.DOTALL
    )
    
    # 3. g139 수정 (and Soft Tissue Infection)
    content = re.sub(
        r'("id":\s*"g139".*?"title":\s*").*?(")',
        r'\1지역사회 획득 피부 및 연조직 감염의 항생제 사용지침\2',
        content, flags=re.DOTALL
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Titles updated successfully.")

fix_titles('data.js')
