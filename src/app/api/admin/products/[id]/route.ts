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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const catalog = getCatalog();
  const product = catalog.products.find((p: any) => p.id === params.id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedProduct = await request.json();
    const catalog = getCatalog();

    const productIndex = catalog.products.findIndex((p: any) => p.id === params.id);
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    catalog.products[productIndex] = { ...catalog.products[productIndex], ...updatedProduct };
    saveCatalog(catalog);

    return NextResponse.json(catalog.products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catalog = getCatalog();

    const productIndex = catalog.products.findIndex((p: any) => p.id === params.id);
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    catalog.products.splice(productIndex, 1);
    saveCatalog(catalog);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
