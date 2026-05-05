import json
import csv
import re
import os

def load_data(filepath):
    data = []
    try:
        # Use utf-8-sig to automatically handle BOM
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize keys because some files might have different header names
                normalized_row = {}
                for k, v in row.items():
                    if not k: continue
                    key = k.strip()
                    if key in ['분류1', 'Major', '분류 1']: normalized_row['분류1'] = v
                    elif key in ['분류2', 'Minor', '분류 2']: normalized_row['분류2'] = v
                    elif key in ['분류3(기전)', '분류3', 'Sub', '분류 3']: normalized_row['분류3'] = v
                    elif key in ['성분명', 'Ingredient']: normalized_row['성분명'] = v
                    elif key in ['상품명', 'Reference', '제품명']: normalized_row['상품명'] = v
                    else: normalized_row[key] = v
                data.append(normalized_row)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return data

def process_data(all_rows):
    # Group by (Major, Minor, Sub)
    groups = {}
    last_major = ""
    last_minor = ""
    last_sub = ""
    
    for row in all_rows:
        major = (row.get('분류1') or '').strip()
        minor = (row.get('분류2') or '').strip()
        sub = (row.get('분류3(기전)') or row.get('분류3') or '').strip()
        ingredient = (row.get('성분명') or '').strip()
        reference = (row.get('상품명') or '').strip()
        
        # Filling logic
        if not major: major = last_major
        else: last_major = major
        
        if not minor: minor = last_minor
        else: last_minor = minor
        
        if not sub: sub = last_sub
        else: last_sub = sub

        if not major: continue
        
        # Normalization
        if major == '향정신병약물':
            major = '[12. 정신/행동장애]'
            
        # Clean up reference
        reference = re.sub(r'\[cite:.*?\]', '', reference).strip()
        
        if ingredient == '-' or not ingredient:
            continue

        key = (major, minor, sub)
        if key not in groups:
            groups[key] = []
        
        groups[key].append({
            "ingredient": ingredient,
            "reference": reference
        })
    return groups

def main():
    data_dir = 'public/data'
    # Use specific file order if possible, otherwise sorted filenames
    # The order of files matters for the overall sequence
    files = [
        'gemini-code-1777632211937.csv', # Ch 1
        'gemini-code-1777632334086.csv', # Ch 2
        'gemini-code-1777632372988.csv', # Ch 3
        'gemini-code-1777632576451.csv', # Ch 4, 5, 6
        'gemini-code-1777632678231.csv', # Ch 7
        'gemini-code-1777633130112.txt', # Ch 8
        'gemini-code-1777633142003.txt', # Ch 9
        'gemini-code-1777633181275.txt', # Ch 10
        'gemini-code-1777633209423.txt', # Ch 11
        'gemini-code-1777633265024.txt', # Ch 12
        'gemini-code-1777638091399.txt', # Ch 13
        'gemini-code-1777638119483.txt', # Ch 14, 15
    ]
    
    # Filter only existing files
    existing_files = [f for f in files if os.path.exists(os.path.join(data_dir, f))]
    
    all_rows = []
    appearance_order = [] # List of (Major, Minor, Sub) in order of appearance
    seen_keys = set()
    
    last_major = ""
    last_minor = ""
    last_sub = ""
    
    for filename in existing_files:
        filepath = os.path.join(data_dir, filename)
        rows = load_data(filepath)
        all_rows.extend(rows)
        
        # Track order within each file
        for row in rows:
            major = (row.get('분류1') or '').strip()
            minor = (row.get('분류2') or '').strip()
            sub = (row.get('분류3(기전)') or row.get('분류3') or '').strip()
            
            if not major: major = last_major
            else: last_major = major
            if not minor: minor = last_minor
            else: last_minor = minor
            if not sub: sub = last_sub
            else: last_sub = sub
            
            if not major: continue
            if major == '향정신병약물': major = '[12. 정신/행동장애]'
            
            key = (major, minor, sub)
            if key not in seen_keys:
                appearance_order.append(key)
                seen_keys.add(key)
    
    csv_groups = process_data(all_rows)
    
    # Read current drugs.json to preserve images and other metadata
    drugs_path = 'public/data/db/drugs.json'
    current_drugs = []
    if os.path.exists(drugs_path):
        with open(drugs_path, 'r', encoding='utf-8') as f:
            current_drugs = json.load(f)
    
    existing_images = {}
    for d in current_drugs:
        for item in d.get('items', []):
            img = item.get('image', '')
            if img:
                existing_images[(item['ingredient'], item['reference'])] = img

    new_drugs = []
    next_id_num = 1
    
    # Use appearance_order to build the new list
    for key in appearance_order:
        if key not in csv_groups: continue
        
        major, minor, sub = key
        items = csv_groups[key]
        
        processed_items = []
        for it in items:
            img = existing_images.get((it['ingredient'], it['reference']), "")
            processed_items.append({
                "ingredient": it['ingredient'],
                "reference": it['reference'],
                "image": img
            })
        
        new_drugs.append({
            "id": f"drug_v4_{next_id_num}",
            "major": major,
            "minor": minor,
            "sub": sub,
            "items": processed_items
        })
        next_id_num += 1

    with open(drugs_path, 'w', encoding='utf-8') as f:
        json.dump(new_drugs, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully updated {drugs_path} with exact appearance order.")

if __name__ == "__main__":
    main()
