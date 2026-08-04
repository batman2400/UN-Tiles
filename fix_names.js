const fs = require('fs');

const catalogStr = fs.readFileSync('./src/data/catalog.json', 'utf8');
const catalog = JSON.parse(catalogStr);

// 1. Rename Pool Tiles
const poolNames = {
  'UN-POO-100': 'Ocean Cyan Pool Tile',
  'UN-POO-101': 'Sapphire Deep Pool Tile',
  'UN-POO-102': 'Navy Blue Pool Tile',
  'UN-POO-103': 'Turquoise Lagoon Pool Tile',
  'UN-POO-104': 'Royal Azure Pool Tile',
  'UN-POO-105': 'Cobalt Sea Pool Tile',
  'UN-POO-106': 'Marine Blue Pool Tile',
  'UN-POO-107': 'Aqua Clear Pool Tile'
};

for (const p of catalog.products) {
  if (poolNames[p.sku]) {
    p.name = poolNames[p.sku];
  }
}

// 2. Remove mosaic fan and add Autumn Matte
const fanIndex = catalog.products.findIndex(p => p.sku === 'UN-MOS-108');
if (fanIndex !== -1) {
  // Replace it with Autumn Matte
  catalog.products[fanIndex] = {
    id: 'tile-wall-11',
    sku: 'UN-WAL-110',
    name: 'Autumn Matte',
    dimensions: '60x60 cm',
    pricePerSqFt: 1650,
    image: '/tiles/wall_autumn.jpg',
    categorySlug: 'wall',
    featured: false,
    finish: 'Matte',
    application: 'Interior',
    stockSqFt: 1000
  };
}

fs.writeFileSync('./src/data/catalog.json', JSON.stringify(catalog, null, 2));
console.log('catalog.json updated!');

// Generate SQL
let sql = `-- Update Product Names and Replace Mosaic Fan\n\n`;

for (const p of catalog.products) {
  if (poolNames[p.sku]) {
    sql += `UPDATE public.products SET name = '${p.name}' WHERE sku = '${p.sku}';\n`;
  }
}

// SQL for removing fan and adding Autumn Matte
sql += `\n-- Remove Mosaic Fan and Add Autumn Matte\n`;
sql += `DELETE FROM public.products WHERE sku = 'UN-MOS-108';\n`;
sql += `INSERT INTO public.products (id, sku, name, dimensions, price_per_sqft, image, category_slug, featured, finish, application, stock_sqft)\n`;
sql += `VALUES ('tile-wall-11', 'UN-WAL-110', 'Autumn Matte', '60x60 cm', 1650, '/tiles/wall_autumn.jpg', 'wall', false, 'Matte', 'Interior', 1000)\n`;
sql += `ON CONFLICT (id) DO UPDATE SET sku = EXCLUDED.sku, name = EXCLUDED.name, image = EXCLUDED.image, category_slug = EXCLUDED.category_slug;\n`;

fs.writeFileSync('update_pool_and_fan.sql', sql);
console.log('SQL generated to update_pool_and_fan.sql');
