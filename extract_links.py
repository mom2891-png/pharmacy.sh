import os
import fitz
import json

def get_pdf_file():
    basedir = "public/data"
    for f in os.listdir(basedir):
        if f.endswith('.pdf'):
            return os.path.join(basedir, f)
    raise FileNotFoundError("PDF not found")

def main():
    pdf_path = get_pdf_file()
    doc = fitz.open(pdf_path)
    
    link_results = []
    
    for page_num in range(2, len(doc)): # skip first 2 pages of general index/laws
        page = doc[page_num]
        links = page.get_links()
        if not links:
            continue
            
        for link in links:
            if 'uri' not in link:
                continue
            uri = link['uri']
            rect = fitz.Rect(link['from'])
            
            # Expand rect slightly to catch whole words if the box is tight
            rect.x0 -= 2
            rect.x1 += 2
            
            text = page.get_textbox(rect).replace('\n', ' ').strip()
            
            if text:
                link_results.append({
                    "text": text,
                    "uri": uri
                })
                
    with open('../parsed_guidelines.json', 'r', encoding='utf-8') as f:
        guidelines = json.load(f)
        
    updated = 0
    
    import difflib
    
    for g in guidelines:
        title_stripped = g['title'].replace(" ", "")
        if 'url' in g:
            del g['url']
            
        best_uri = None
        best_ratio = 0.0
        
        for lr in link_results:
            lr_stripped = lr['text'].replace(" ", "")
            if not lr_stripped: continue
            
            # Substring match ratio
            ratio = difflib.SequenceMatcher(None, title_stripped, lr_stripped).ratio()
            
            # Or if it's a direct perfect substring but long enough
            if (lr_stripped in title_stripped or title_stripped in lr_stripped) and len(lr_stripped) > 3:
                ratio = max(ratio, 0.8)
                
            if ratio > best_ratio and ratio > 0.5:
                best_ratio = ratio
                best_uri = lr['uri']
        
        if best_uri:
            g['url'] = best_uri
            updated += 1
            
    print(f"Matched {updated} out of {len(guidelines)} guidelines with URIs.")
    
    with open('../parsed_guidelines.json', 'w', encoding='utf-8') as f:
        json.dump(guidelines, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
