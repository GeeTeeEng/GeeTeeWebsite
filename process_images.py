import os
from PIL import Image

def process_image(input_path, output_path, target_size=(1024, 768)):
    try:
        # Open the image and convert to RGBA (to handle transparency if any)
        img = Image.open(input_path).convert("RGBA")
        
        # Create a new white background image of the target size
        new_img = Image.new("RGBA", target_size, (255, 255, 255, 255))
        
        # Calculate aspect ratio preserving dimensions
        img_ratio = img.width / img.height
        target_ratio = target_size[0] / target_size[1]
        
        if img_ratio > target_ratio:
            # Image is wider
            new_width = target_size[0]
            new_height = int(target_size[0] / img_ratio)
        else:
            # Image is taller
            new_height = target_size[1]
            new_width = int(target_size[1] * img_ratio)
            
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Paste the resized image into the center of the white background
        x = (target_size[0] - new_width) // 2
        y = (target_size[1] - new_height) // 2
        
        # We paste using img as a mask if it has transparency
        new_img.paste(img, (x, y), img if img.mode == 'RGBA' else None)
        
        # Convert to RGB and save as webp
        new_img.convert("RGB").save(output_path, "WEBP", quality=90)
        print(f"Processed: {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    input_dir = "Gee Tee Machines"
    output_dir = "static/images/machines"
    
    mapping = {
        "DNM 5700.jpg": "doosan-dnm-5700.webp",
        "DNM6700-정면-문닫힘.jpg": "doosan-dnm-6700.webp",
        "Dongs TCK800.webp": "dongs-tck800.webp",
        "Doosan Puma 280LM.jpeg": "doosan-puma-280lm.webp",
        "GOODWAY_GLS200_Product.webp": "goodway-gls200.webp",
        "Goodway GA-2600.jpg": "goodway-ga-2600.webp",
        "Robocut.jpeg": "fanuc-robocut-ac400ic.webp",
        "agie-charmilles-cut-e-600-1000x1000.webp": "agie-charmilles-cut-e-600.webp"
    }
    
    for filename in os.listdir(input_dir):
        if filename in mapping:
            in_path = os.path.join(input_dir, filename)
            out_path = os.path.join(output_dir, mapping[filename])
            process_image(in_path, out_path)
