import fitz  # PyMuPDF
import os
import json
import re

pdf_path = r"assets\data\약제 분류표.pdf"
image_dir = r"assets\images\drugs"
os.makedirs(image_dir, exist_ok=True)

doc = fitz.open(pdf_path)

# Load existing drugs to update
with open('scratch/parsed_drugs.json', 'r', encoding='utf-8') as f:
    drugs_data = json.load(f)

# Helper to check if a string looks like a drug name
def is_drug_name(s):
    return bool(re.search(r'[a-zA-Z가-힣]', s)) and len(s.strip()) > 1

def process_pdf():
    global_drug_idx = 0
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        
        # 1. Get all images on the page with their locations
        image_list = page.get_images(full=True)
        img_info = []
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            # Get the actual image rectangle on the page
            rects = page.get_image_rects(xref)
            if rects:
                rect = rects[0]
                # Save the image
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha > 3: # CMYK
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                
                img_name = f"page_{page_idx+1}_img_{img_idx}.png"
                img_path = os.path.join(image_dir, img_name)
                pix.save(img_path)
                
                img_info.append({
                    "path": f"assets/images/drugs/{img_name}",
                    "rect": rect
                })
                pix = None # free memory

        if not img_info:
            continue

        # 2. Get all text with locations
        text_words = page.get_text("words") # (x0, y0, x1, y1, "word", block_no, line_no, word_no)
        
        # Try to find which drugs in our JSON belong to this page
        # This is a bit tricky since our JSON doesn't store page info.
        # But we can try to match the text on this page with drug names in our JSON.
        
        # We'll iterate through drugs and see if their ingredient/reference appears on this page
        for drug_cat in drugs_data:
            for item in drug_cat["items"]:
                ing = item["ingredient"]
                ref = item["reference"]
                
                # Find coordinates of this drug name on page
                found_rect = None
                if ing:
                    rects = page.search_for(ing)
                    if rects: found_rect = rects[0]
                if not found_rect and ref:
                    rects = page.search_for(ref)
                    if rects: found_rect = rects[0]
                
                if found_rect:
                    # Match with the nearest image
                    nearest_img = None
                    min_dist = float('inf')
                    
                    for img in img_info:
                        # Distance between drug text rect and image rect
                        # (Simplistic: distance between centers)
                        d_center = ((found_rect.x0 + found_rect.x1)/2, (found_rect.y0 + found_rect.y1)/2)
                        i_center = ((img["rect"].x0 + img["rect"].x1)/2, (img["rect"].y0 + img["rect"].y1)/2)
                        
                        dist = ((d_center[0]-i_center[0])**2 + (d_center[1]-i_center[1])**2)**0.5
                        
                        # Only match if they are reasonably close (e.g. within 200 points)
                        if dist < 200 and dist < min_dist:
                            min_dist = dist
                            nearest_img = img["path"]
                    
                    if nearest_img:
                        item["image"] = nearest_img

    # Save updated data
    with open('scratch/parsed_drugs_with_images.json', 'w', encoding='utf-8') as f:
        json.dump(drugs_data, f, ensure_ascii=False, indent=2)

    print("Extraction and matching complete.")

process_pdf()
