import os
import shutil

# 1. Update data.js
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"public/data/', '"assets/data/')

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("data.js updated successfully.")

# 2. Try to rename public to old_public to get it out of the way
try:
    if os.path.exists('public'):
        os.rename('public', 'old_public')
        print("public renamed to old_public.")
except Exception as e:
    print(f"Failed to rename public: {e}")
    # Force delete if rename fails
    try:
        shutil.rmtree('public', ignore_errors=True)
        print("public removed forcefully.")
    except Exception as e2:
        print(f"Failed to remove public: {e2}")
