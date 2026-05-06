import fitz
import json
import os
import re

pdf_path = r"assets\data\약제 분류표.pdf"
image_dir = r"assets\images\drugs"
os.makedirs(image_dir, exist_ok=True)

doc = fitz.open(pdf_path)

def clean_text(t):
    if not t: return ""
    return re.sub(r'\s+', ' ', t).strip()

def is_english(s):
    if not s: return False
    # Check if it's a valid drug name or sub (start with capital, min length 2)
    return bool(re.search(r'^[A-Z]', s)) and not bool(re.search(r'[가-힣]', s)) and len(s) > 1

def is_korean(s):
    if not s: return False
    return bool(re.search(r'[가-힣]', s))

def is_junk(s):
    # Filter out common PDF artifacts or non-drug guidance text
    junk_keywords = ["참고", "파트", "예정", "주의", "중복", "혼합", "속효", "장시간"]
    if not s: return True
    if any(k in s for k in junk_keywords): return True
    if len(s) == 1: return True
    return False

def is_subcategory_header(s):
    if not s: return False
    s = s.strip()
    keywords = ['(', ')', '계', '차단제', '억제제', 'Inh', 'i', '제제', '유사체', 'agonist', 'antagonist']
    if any(k in s for k in keywords): return True
    # Short English acronyms are often subcategories (CCB, BB, ACEi)
    if len(s) <= 10 and is_english(s) and sum(1 for c in s if c.isupper()) >= 2: return True
    return False

def process_v4():
    all_drugs = []
    current_major = "[기타]"
    current_minor = "미분류"
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        image_list = page.get_images(full=True)
        img_info = []
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            rects = page.get_image_rects(xref)
            if rects:
                img_info.append({"path": f"assets/images/drugs/p{page_idx+1}_i{img_idx}.png", "rect": rects[0]})

        tabs = page.find_tables()
        if not tabs or not tabs.tables: continue

        for tab in tabs.tables:
            table_data = tab.extract()
            last_known_sub = "상세 분류"
            
            i = 0
            while i < len(table_data):
                row = [clean_text(c) for c in table_data[i]]
                non_empty_indices = [idx for idx, c in enumerate(row) if c]
                non_empty_cells = [row[idx] for idx in non_empty_indices]
                
                # 1. Update Major Category
                if non_empty_cells and non_empty_cells[0].startswith('[') and ']' in non_empty_cells[0]:
                    current_major = non_empty_cells[0]
                    # Also try to find minor from same cell or next
                    if len(non_empty_cells) > 1: current_minor = non_empty_cells[1]
                
                # 2. Subcategory / Minor Detection
                # If a row has only 1 or 2 items and they look like categories
                if 1 <= len(non_empty_cells) <= 2:
                    potential_sub = non_empty_cells[0]
                    if is_subcategory_header(potential_sub):
                        last_known_sub = potential_sub
                        if "치료제" in potential_sub: current_minor = potential_sub
                        # Check if the next cell is also a sub
                        if len(non_empty_cells) > 1 and is_subcategory_header(non_empty_cells[1]):
                            # We'll just take the first one or combine
                            pass
                        i += 1
                        continue

                # 3. Drug Item Detection
                # A drug row usually has multiple English names
                # OR it has one English name but followed by Korean names in next row
                eng_cells = [(idx, c) for idx, c in enumerate(row) if is_english(c) and not is_junk(c)]
                
                # Check if this row is just a horizontal list of ingredients
                if len(eng_cells) >= 1:
                    # Look ahead to see if next row is Korean names
                    kor_row = []
                    if i + 1 < len(table_data):
                        kor_row = [clean_text(c) for c in table_data[i+1]]
                    
                    # Validate if kor_row is really a matching Korean row
                    is_valid_kor = any(is_korean(c) and not is_junk(c) for c in kor_row)
                    
                    if is_valid_kor or len(eng_cells) >= 2:
                        items = []
                        for col_idx, eng_name in eng_cells:
                            # Skip if the English name is actually the subcategory name already
                            if eng_name == last_known_sub: continue
                            
                            kor_name = kor_row[col_idx] if col_idx < len(kor_row) else ""
                            if is_junk(kor_name): kor_name = ""
                            
                            # Match Image
                            item_img = ""
                            cell_rect = tab.rows[i].cells[col_idx]
                            if cell_rect:
                                search_rect = fitz.Rect(cell_rect[0], cell_rect[1]-30, cell_rect[2], cell_rect[3]+30)
                                for img in img_info:
                                    if img["rect"].intersects(search_rect):
                                        item_img = img["path"]; break
                            
                            items.append({"ingredient": eng_name, "reference": kor_name, "image": item_img})
                        
                        if items:
                            all_drugs.append({
                                "id": f"drug_v4_{len(all_drugs)+1}",
                                "major": current_major, "minor": current_minor, "sub": last_known_sub,
                                "items": items
                            })
                        
                        if is_valid_kor: i += 1 # Consume Korean row
                    
                i += 1
    return all_drugs

final_data = process_v4()
print(f"V4 Parser Results: {len(final_data)} groups.")

with open('scratch/refined_drugs_v4.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
