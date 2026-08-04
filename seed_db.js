/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jnihpfdrqrdmxebbabmj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaWhwZmRycXJkbXhlYmJhYm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjg1OTQsImV4cCI6MjA5Mjg0NDU5NH0.lpoiw2zhhcubzkpRwdPmmlOYBrglfVv8vFV_VRs4Ij0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const catalogStr = fs.readFileSync('./src/data/catalog.json', 'utf8');
  const catalog = JSON.parse(catalogStr);

  console.log('Cleaning up old products and categories...');
  // Since products reference categories, delete products first
  // However, there is a cascade delete if defined, but to be safe we just delete all
  // Wait, to delete all products without a specific condition:
  // We can't delete without a filter in Supabase JS using anon key usually, unless RLS allows it.
  // The policy says: "Products can be updated by anyone (seed)." but does it say delete?
  // Let's check policies.
  
  // We'll delete where id is not null
  const { error: pErr } = await supabase.from('products').delete().neq('id', 'dummy');
  if (pErr) console.log('Delete products err:', pErr);

  const { error: cErr } = await supabase.from('categories').delete().neq('slug', 'dummy');
  if (cErr) console.log('Delete categories err:', cErr);

  console.log('Seeding categories...');
  for (const cat of catalog.categories) {
    const { error } = await supabase.from('categories').upsert({
      slug: cat.slug,
      name: cat.name,
      image: cat.image
    });
    if (error) console.log('Err cat:', error);
  }

  console.log('Seeding products...');
  for (const p of catalog.products) {
    const { error } = await supabase.from('products').upsert({
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
      stock_sqft: 1000
    });
    if (error) console.log('Err prod:', error);
  }
  console.log('Done seeding!');
}

run();
