import re

def final_fix(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # g139 최종 수정 (공식 영어 제목)
    content = re.sub(
        r'("id":\s*"g139".*?"title":\s*").*?(")',
        r'\1Clinical Guidelines for the Antibiotic Treatment for Community-Acquired Skin and Soft Tissue Infection\2',
        content, flags=re.DOTALL
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("g139 title updated to official English version.")

final_fix('data.js')
