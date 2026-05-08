import os
import PyPDF2

def compress_pdf(input_path, output_path):
    try:
        reader = PyPDF2.PdfReader(input_path)
        writer = PyPDF2.PdfWriter()

        for page in reader.pages:
            # This doesn't recompress images, but removes some metadata
            writer.add_page(page)

        # Add compression to the writer
        for page in writer.pages:
            page.compress_content_streams()  # This compresses text and graphics streams

        with open(output_path, "wb") as f:
            writer.write(f)
        
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        new_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"Original size: {original_size:.2f} MB")
        print(f"New size: {new_size:.2f} MB")
        return new_size
    except Exception as e:
        print(f"Error: {e}")
        return None

input_file = r"public\data\guidelines\심부전 진료지침 2022.pdf"
output_file = r"public\data\guidelines\심부전 진료지침 2022_compressed.pdf"

# Find the actual filename (handle encoding issues)
target_dir = r"public\data\guidelines"
files = os.listdir(target_dir)
for f in files:
    if "심부전" in f and "2022" in f and f.endswith(".pdf"):
        input_file = os.path.join(target_dir, f)
        break

print(f"Processing: {input_file}")
compress_pdf(input_file, output_file)
