import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const catalogPath = join(process.cwd(), 'src/data/catalog.json');

function getCatalog() {
  try {
    const data = readFileSync(catalogPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading catalog:', error);
    return { categories: [], products: [] };
  }
}

function saveCatalog(catalog: any) {
  try {
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  } catch (error) {
    console.error('Error saving catalog:', error);
  }
}

export async function GET() {
  const catalog = getCatalog();
  return NextResponse.json(catalog.products || []);
}

export async function POST(request: NextRequest) {
  try {
    const product = await request.json();
    const catalog = getCatalog();

    // Generate new ID if not provided
    if (!product.id) {
      const maxId = Math.max(
        ...catalog.products.map((p: any) => parseInt(p.id.replace('p', '')) || 0),
        0
      );
      product.id = `p${maxId + 1}`;
    }

    catalog.products.push(product);
    saveCatalog(catalog);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
