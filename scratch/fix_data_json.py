import json
import re

def fix_json():
    with open('data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'const DB = (\{.*?\});', content, re.DOTALL)
    if not match:
        print("Not found")
        return
        
    db_str = match.group(1)
    
    # Try to load with strict=False to handle literal newlines
    try:
        db = json.loads(db_str, strict=False)
        print("Loaded with strict=False")
    except Exception as e:
        print(f"Error loading: {e}")
        # Manual fallback: replace literal newlines that are inside quotes
        # This is tricky, but let's try a simpler approach
        fixed_str = re.sub(r'("(?:[^"\\]|\\.)*")', lambda m: m.group(1).replace('\n', '\\n'), db_str)
        db = json.loads(fixed_str)
        print("Loaded with manual fix")

    new_json = json.dumps(db, indent=2, ensure_ascii=False)
    new_content = content.replace(db_str, new_json)
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed data.js")

if __name__ == "__main__":
    fix_json()
