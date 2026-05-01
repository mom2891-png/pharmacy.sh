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
    # Drug names start with capital letters and contain alphabets
    return bool(re.search(r'^[A-Z][a-zA-Z0-9\-\s\+]+$', s))

def is_korean(s):
    if not s: return False
    return bool(re.search(r'[가-힣]', s))

def is_subcategory_header(s):
    if not s: return False
    s = s.strip()
    # Patterns for sub-categories: "ACEi (pril)", "ARB", "BB (선택성)", etc.
    keywords = ['(', ')', '계', '차단제', '억제제', 'Inh', 'i', '제제', '유사체', 'agonist', 'antagonist']
    if any(k in s for k in keywords): return True
    if len(s) < 30 and is_english(s) and sum(1 for c in s if c.isupper()) >= 2: return True
    return False

def process_v3():
    all_drugs = []
    current_major = "[기타]"
    current_minor = "미분류"
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        
        # Images
        image_list = page.get_images(full=True)
        img_info = []
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            rects = page.get_image_rects(xref)
            if rects:
                img_info.append({"path": f"assets/images/drugs/p{page_idx+1}_i{img_idx}.png", "rect": rects[0]})

        tabs = page.find_tables()
        if not tabs or not tabs.tables:
            continue

        for tab in tabs.tables:
            table_data = tab.extract()
            # Track the most recent sub-category found in this table
            last_known_sub = "상세 분류"
            
            i = 0
            while i < len(table_data):
                row = [clean_text(c) for c in table_data[i]]
                
                # Update Major/Minor from first columns or specific headers
                if row[0].startswith('[') and ']' in row[0]:
                    current_major = row[0]
                
                # Check for sub-category header in this row
                # (A row with few columns and sub-category markers)
                non_empty = [c for c in row if c]
                if 1 <= len(non_empty) <= 3:
                    for c in non_empty:
                        if is_subcategory_header(c):
                            last_known_sub = c
                            # If it looks like a Minor category (contains "치료제")
                            if "치료제" in c:
                                current_minor = c
                            break
                
                # Detect Drug Row (Multiple English names starting with Uppercase)
                eng_cells = [(idx, c) for idx, c in enumerate(row) if is_english(c)]
                
                if len(eng_cells) >= 2:
                    # Found a drug row!
                    # 1. Identify Korean row (usually the next row)
                    kor_row = []
                    if i + 1 < len(table_data):
                        kor_row = [clean_text(c) for c in table_data[i+1]]
                    
                    # 2. Refine Sub-category for this specific group
                    # Sometimes the sub-category is in the row above the drugs
                    group_sub = last_known_sub
                    if i > 0:
                        prev_row = [clean_text(c) for c in table_data[i-1]]
                        for c in prev_row:
                            if is_subcategory_header(c):
                                group_sub = c
                                break
                    
                    items = []
                    for col_idx, eng_name in eng_cells:
                        kor_name = kor_row[col_idx] if col_idx < len(kor_row) else ""
                        
                        # Match Image
                        item_img = ""
                        cell_rect = tab.rows[i].cells[col_idx]
                        if cell_rect:
                            search_rect = fitz.Rect(cell_rect[0], cell_rect[1]-35, cell_rect[2], cell_rect[3]+35)
                            for img in img_info:
                                if img["rect"].intersects(search_rect):
                                    item_img = img["path"]
                                    break
                        
                        items.append({
                            "ingredient": eng_name,
                            "reference": kor_name,
                            "image": item_img
                        })
                    
                    if items:
                        all_drugs.append({
                            "id": f"drug_v3_{len(all_drugs)+1}",
                            "major": current_major,
                            "minor": current_minor,
                            "sub": group_sub,
                            "items": items
                        })
                    
                    i += 1 # Skip Korean row
                i += 1
    return all_drugs

final_data = process_v3()
print(f"V3 Parser Results: {len(final_data)} categories, {sum(len(d['items']) for d in final_data)} drugs.")

with open('scratch/refined_drugs_v3.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
