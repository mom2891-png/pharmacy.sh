import os
import PyPDF2

def split_pdf(input_path, split_page):
    try:
        reader = PyPDF2.PdfReader(input_path)
        total_pages = len(reader.pages)
        
        # Part 1
        writer1 = PyPDF2.PdfWriter()
        for i in range(split_page):
            writer1.add_page(reader.pages[i])
        
        output1 = input_path.replace(".pdf", "_Part1.pdf")
        with open(output1, "wb") as f:
            writer1.write(f)
            
        # Part 2
        writer2 = PyPDF2.PdfWriter()
        for i in range(split_page, total_pages):
            writer2.add_page(reader.pages[i])
            
        output2 = input_path.replace(".pdf", "_Part2.pdf")
        with open(output2, "wb") as f:
            writer2.write(f)
            
        print(f"Split completed: \n1: {output1} \n2: {output2}")
        return output1, output2
    except Exception as e:
        print(f"Error: {e}")
        return None

# Find the file
target_dir = r"public\data\guidelines"
input_file = ""
files = os.listdir(target_dir)
for f in files:
    if "심부전" in f and "2022" in f and f.endswith(".pdf") and "_Part" not in f:
        input_file = os.path.join(target_dir, f)
        break

if input_file:
    print(f"Splitting: {input_file}")
    split_pdf(input_file, 150) # Split at page 150
else:
    print("File not found.")
