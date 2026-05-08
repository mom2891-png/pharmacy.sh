import os
import fitz

def get_pdf_file():
    basedir = "public/data"
    for f in os.listdir(basedir):
        if f.endswith('.pdf'):
            return os.path.join(basedir, f)

pdf_path = get_pdf_file()
doc = fitz.open(pdf_path)

with open('links_found2.txt', 'w', encoding='utf-8') as f:
    for page_num in range(2, len(doc)):
        page = doc[page_num]
        links = page.get_links()
        if not links: continue
            
        for link in links:
            if 'uri' not in link: continue
            rect = fitz.Rect(link['from'])
            rect.x0 -= 2
            rect.x1 += 2
            text = page.get_textbox(rect).replace('\n', '')
            f.write(f"URI: {link['uri']} | TEXT: {text}\n")
