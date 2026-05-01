import fitz

doc = fitz.open(r"assets\data\약제 분류표.pdf")
page = doc[1] # Page 2

tabs = page.find_tables()
print(f"Found {len(tabs.tables)} tables on page 2")

if tabs.tables:
    tab = tabs.tables[0]
    print("Table bbox:", tab.bbox)
    for i, row in enumerate(tab.extract()):
        print(f"Row {i}: {row}")
