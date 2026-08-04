import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const catalogPath = './src/data/catalog.json';
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Fix double/triple spaces
for (const product of catalogData.products) {
  product.name = product.name.replace(/\s+/g, ' ').trim();
}

fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2));
console.log('Fixed catalog.json names');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncDB() {
  // Clear products
  await supabase.from('products').delete().neq('id', '0');
  console.log('Cleared existing products');

  // Re-insert
  const { error } = await supabase.from('products').insert(
    catalogData.products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      dimensions: p.dimensions,
      price_per_sqft: p.pricePerSqFt,
      image: p.image,
      category_slug: p.categorySlug,
      featured: p.featured,
      finish: p.finish,
      application: p.application,
      stock_sqft: p.stockSqFt
    }))
  );

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully synced DB with original catalog data');
  }
}

syncDB();
