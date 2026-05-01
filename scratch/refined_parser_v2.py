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
    # Remove excessive newlines and spaces caused by PDF layout
    return re.sub(r'\s+', ' ', t).strip()

def is_english(s):
    if not s: return False
    return bool(re.search(r'[a-zA-Z]', s)) and not bool(re.search(r'[가-힣]', s))

def is_korean(s):
    if not s: return False
    return bool(re.search(r'[가-힣]', s))

def process_all_pages():
    all_drugs = []
    
    current_major = "기타"
    current_minor = "미분류"
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        
        # Get images on page for spatial matching
        image_list = page.get_images(full=True)
        img_info = []
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            rects = page.get_image_rects(xref)
            if rects:
                rect = rects[0]
                img_name = f"p{page_idx+1}_i{img_idx}.png"
                img_path = os.path.join(image_dir, img_name)
                
                # Check if file exists to avoid re-extracting (saves time)
                if not os.path.exists(img_path):
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n - pix.alpha > 3: pix = fitz.Pixmap(fitz.csRGB, pix)
                    pix.save(img_path)
                    pix = None
                
                img_info.append({"path": f"assets/images/drugs/{img_name}", "rect": rect})

        # Find tables
        tabs = page.find_tables()
        if not tabs or not tabs.tables:
            # Fallback to simple text if no tables (headers usually)
            text = page.get_text()
            major_match = re.search(r'\[\d+\..*?\]', text)
            if major_match: current_major = major_match.group()
            continue

        for tab in tabs.tables:
            table_data = tab.extract()
            # table_data is a list of lists (rows of cells)
            # cell_rects is available in tab.cells
            
            # Heuristic to find major/minor from the first few rows
            i = 0
            while i < len(table_data):
                row = table_data[i]
                row_cells = tab.rows[i].cells # Bboxes of cells in this row
                
                # Clean row
                cleaned_row = [clean_text(c) for c in row]
                
                # Check for Major Category
                first_cell = cleaned_row[0] if cleaned_row else ""
                if first_cell.startswith('[') and ']' in first_cell:
                    current_major = first_cell
                
                # Detect English Row (Ingredients)
                # If a row has many English words
                eng_count = sum(1 for c in cleaned_row if is_english(c))
                kor_count = sum(1 for c in cleaned_row if is_korean(c))
                
                # If it's a category header (like "고혈압 치료제")
                if kor_count == 1 and eng_count == 0 and len(cleaned_row[0]) > 0:
                    current_minor = cleaned_row[0]
                
                # If it's an ingredient row (multiple English names)
                if eng_count >= 2:
                    # Look for corresponding Korean row (usually next row)
                    next_row_cleaned = []
                    next_row_cells = []
                    if i + 1 < len(table_data):
                        next_row_cleaned = [clean_text(c) for c in table_data[i+1]]
                        next_row_cells = tab.rows[i+1].cells
                    
                    items = []
                    for col_idx, eng_name in enumerate(cleaned_row):
                        if not eng_name or not is_english(eng_name): continue
                        
                        kor_name = next_row_cleaned[col_idx] if col_idx < len(next_row_cleaned) else ""
                        
                        # Find sub-category (might be in a row above or same row)
                        # For simplicity, we'll use the last known sub-category markers
                        # (This part is tricky, we'll try to find any marker in current or previous row)
                        current_sub = "분류 정보"
                        # Look for something like "ACEi" in the current or previous row cells
                        for prev_offset in range(0, 2):
                            if i - prev_offset >= 0:
                                prev_row = [clean_text(c) for c in table_data[i-prev_offset]]
                                for c in prev_row:
                                    if '(' in c or '계' in c or 'Inh' in c:
                                        current_sub = c
                                        break
                        
                        # Match Image
                        item_img = ""
                        cell_rect = tab.rows[i].cells[col_idx]
                        if cell_rect:
                            # Search for image intersecting this cell or slightly above/below
                            # Expand rect slightly to catch images
                            search_rect = fitz.Rect(cell_rect[0], cell_rect[1]-30, cell_rect[2], cell_rect[3]+30)
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
                            "id": f"drug_v2_{len(all_drugs)+1}",
                            "major": current_major,
                            "minor": current_minor,
                            "sub": current_sub,
                            "items": items
                        })
                    
                    i += 1 # Skip the Korean row we just used
                
                i += 1

    return all_drugs

final_data = process_all_pages()
print(f"Total categories: {len(final_data)}")
print(f"Total drugs: {sum(len(d['items']) for d in final_data)}")

with open('scratch/refined_drugs_v2.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)
