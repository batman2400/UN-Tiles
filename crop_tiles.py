import os
from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def crop_directory(directory):
    count = 0
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            filepath = os.path.join(directory, filename)
            try:
                im = Image.open(filepath).convert('RGB')
                
                bg = Image.new('RGB', im.size, (255, 255, 255))
                diff = ImageChops.difference(im, bg)
                diff_gray = diff.convert("L")
                diff_bw = diff_gray.point(lambda p: 255 if p > 15 else 0)
                
                # Ignore the outer 20 pixels which might contain faint borders
                w, h = im.size
                margin = 20
                if w > margin*2 and h > margin*2:
                    diff_inner = diff_bw.crop((margin, margin, w - margin, h - margin))
                    inner_bbox = diff_inner.getbbox()
                    
                    if inner_bbox:
                        # adjust inner_bbox back to original image coordinates
                        bbox = (
                            inner_bbox[0] + margin,
                            inner_bbox[1] + margin,
                            inner_bbox[2] + margin,
                            inner_bbox[3] + margin
                        )
                        cropped_im = im.crop(bbox)
                        cropped_im.save(filepath, quality=95)
                        count += 1
                        print(f"Cropped {filename} to {bbox}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    print(f"Successfully cropped {count} images.")

if __name__ == "__main__":
    tiles_dir = r"c:\Users\mohan\OneDrive\Desktop\Work\UN tiles\public\tiles"
    crop_directory(tiles_dir)
