import fitz  # PyMuPDF
import json

pdf_path = r"assets\data\약제 분류표.pdf"
doc = fitz.open(pdf_path)

extracted_text = ""
for i in range(min(15, len(doc))):  # Extract first 15 pages
    extracted_text += f"\n--- Page {i+1} ---\n"
    extracted_text += doc[i].get_text()

with open("scratch/extracted_pdf_text.txt", "w", encoding="utf-8") as f:
    f.write(extracted_text)

print(f"Extracted text from {min(15, len(doc))} pages.")
