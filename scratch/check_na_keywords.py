
import sqlite3
import os

db_path = 'public/data/db/pharmacy.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check for keywords that might cause incorrect linking
cursor.execute("SELECT ingredient, reference FROM drug_items")
rows = cursor.fetchall()

keywords = set()
for ing, ref in rows:
    if ing: keywords.add(ing)
    if ref: keywords.add(ref)

# Find if 'Na' is in keywords
na_keywords = [k for k in keywords if k and 'Na' in k]
print(f"Found {len(na_keywords)} keywords containing 'Na':")
for k in na_keywords[:20]:
    print(f" - {k}")

exact_na = [k for k in keywords if k == 'Na']
print(f"Exact 'Na' matches: {exact_na}")

conn.close()
