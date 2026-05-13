import os
from PIL import Image

def process_image(input_path, output_path, max_size=(1920, 1080)):
    try:
        img = Image.open(input_path).convert("RGB")
        
        # Calculate aspect ratio
        img_ratio = img.width / img.height
        max_ratio = max_size[0] / max_size[1]
        
        if img.width > max_size[0] or img.height > max_size[1]:
            if img_ratio > max_ratio:
                # Image is wider
                new_width = max_size[0]
                new_height = int(max_size[0] / img_ratio)
            else:
                # Image is taller
                new_height = max_size[1]
                new_width = int(max_size[1] * img_ratio)
                
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save as webp
        img.save(output_path, "WEBP", quality=85)
        print(f"Processed: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    input_dir = "Gallery Pictures"
    output_dir = "static/images/gallery"
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all jpg/jpeg/png files
    valid_exts = ('.jpg', '.jpeg', '.png')
    files = [f for f in os.listdir(input_dir) if f.lower().endswith(valid_exts)]
    files.sort()  # Sort to have consistent numbering
    
    for idx, filename in enumerate(files):
        in_path = os.path.join(input_dir, filename)
        out_name = f"gallery-{idx+1}.webp"
        out_path = os.path.join(output_dir, out_name)
        process_image(in_path, out_path)
