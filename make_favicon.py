import sys
try:
    from PIL import Image
except ImportError:
    print("Pillow not found, installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def create_favicons():
    # Open the logo
    try:
        img = Image.open('static/images/gt-logo.png').convert('RGBA')
    except Exception as e:
        print(f"Error loading gt-logo.png: {e}")
        sys.exit(1)
        
    print(f"Original image size: {img.size}")
    
    # Create a square version by adding transparent padding
    max_dim = max(img.width, img.height)
    square = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    offset = ((max_dim - img.width) // 2, (max_dim - img.height) // 2)
    square.paste(img, offset, img)
    
    print("Square image created. Resizing and saving...")
    
    # Save standard .ico in static/
    square.save('static/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("Saved static/favicon.ico")
    
    # Save a 192x192 PNG for Android/Chrome
    img_192 = square.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save('static/images/favicon-192.png')
    print("Saved static/images/favicon-192.png")
    
    # Save a high-res apple touch icon
    img_180 = square.resize((180, 180), Image.Resampling.LANCZOS)
    
    # Apple touch icon usually expects non-transparent backgrounds, let's put it on navy or black.
    # Actually, it can be transparent too in many cases, but let's stick to what we did for the square.
    bg = Image.new('RGBA', (180, 180), (10, 17, 24, 255)) # match dark theme roughly
    bg.paste(img_180, (0,0), img_180)
    bg.convert("RGB").save('static/apple-touch-icon.png')
    print("Saved static/apple-touch-icon.png")
    
if __name__ == '__main__':
    create_favicons()
