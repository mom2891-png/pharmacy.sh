import os
import fitz
import json

def get_pdf_file():
    basedir = "public/data"
    for f in os.listdir(basedir):
        if f.endswith('.pdf'):
            return os.path.join(basedir, f)
    raise FileNotFoundError("PDF not found")

pdf_path = get_pdf_file()
doc = fitz.open(pdf_path)

link_results = []
for page_num in range(len(doc)):
    page = doc[page_num]
    links = page.get_links()
    if not links:
        continue
        
    words = page.get_text("words")
    for link in links:
        if 'uri' not in link: continue
        rect = fitz.Rect(link['from'])
        linked_text = []
        for w in words:
            word_rect = fitz.Rect(w[:4])
            # calculate intersection area
            intersect = rect.intersect(word_rect)
            if not intersect.is_empty and (intersect.get_area() > 0.5 * word_rect.get_area() or rect.contains(word_rect)):
                linked_text.append(w[4])
        
        link_results.append({
            "page": page_num + 1,
            "text": " ".join(linked_text).strip(),
            "uri": link['uri']
        })

with open('links_found.txt', 'w', encoding='utf-8') as f:
    for lr in link_results:
        f.write(f"PAGE {lr['page']} | TEXT: {lr['text']} | URI: {lr['uri']}\n")
