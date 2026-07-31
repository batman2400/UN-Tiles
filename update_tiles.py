import os
import json
import shutil
import random

base_dir = r"c:\Users\mohan\OneDrive\Desktop\Work\UN tiles"
public_dir = os.path.join(base_dir, "public")
old_data_dir = os.path.join(public_dir, "Tiles Data 1", "Tiles Data")
new_tiles_dir = os.path.join(public_dir, "tiles")

os.makedirs(new_tiles_dir, exist_ok=True)

categories = [
    {"slug": "floor", "name": "Floor Tiles"},
    {"slug": "mosaics", "name": "Mosaics"},
    {"slug": "pool-tiles", "name": "Pool Tiles"},
    {"slug": "wall", "name": "Wall Tiles"}
]

folder_map = {
    "Floor": "floor",
    "Mosaics": "mosaics",
    "Pool Tiles": "pool-tiles",
    "Wall": "wall"
}

products = []
new_categories = []

for cat in categories:
    folder_name = list(folder_map.keys())[list(folder_map.values()).index(cat["slug"])]
    cat_path = os.path.join(old_data_dir, folder_name)
    if os.path.exists(cat_path):
        files = [f for f in os.listdir(cat_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        files.sort()
        selected_files = files[:10]
        
        if selected_files:
            first_safe_name = f"{cat['slug']}_{selected_files[0].replace(' ', '_').replace('-', '_').lower()}"
            cat["image"] = f"/tiles/{first_safe_name}"
            new_categories.append(cat)
            
            dimensions_options = ["60x60 cm", "80x80 cm", "120x60 cm", "30x30 cm Sheet"]
            
            for i, f in enumerate(selected_files):
                safe_name = f"{cat['slug']}_{f.replace(' ', '_').replace('-', '_').lower()}"
                src = os.path.join(cat_path, f)
                dst = os.path.join(new_tiles_dir, safe_name)
                shutil.copy2(src, dst)
                
                dims = random.choice(dimensions_options)
                finish = "Polished" if cat["slug"] == "floor" else "Matte" if cat["slug"] == "wall" else "Glossy"
                
                products.append({
                    "id": f"tile-{cat['slug']}-{i+1}",
                    "sku": f"UN-{cat['slug'][:3].upper()}-{100+i}",
                    "name": f.replace(".jpg", "").replace(".png", "").replace(".jpeg", "").replace("-", " ").title(),
                    "dimensions": dims,
                    "pricePerSqFt": 1500 + (i * 150),
                    "image": f"/tiles/{safe_name}",
                    "categorySlug": cat["slug"],
                    "featured": (i < 2),
                    "finish": finish,
                    "application": "Interior/Exterior" if cat["slug"] == "pool-tiles" else "Interior",
                    "stockSqFt": 1000
                })

catalog = {
    "categories": new_categories,
    "products": products
}

catalog_path = os.path.join(base_dir, "src", "data", "catalog.json")
with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2)

print(f"Successfully processed {len(products)} tiles!")
