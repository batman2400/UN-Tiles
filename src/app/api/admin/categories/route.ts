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
  return NextResponse.json(catalog.categories || []);
}

export async function POST(request: NextRequest) {
  try {
    const category = await request.json();
    const catalog = getCatalog();

    // Check if category already exists
    if (catalog.categories.some((c: any) => c.slug === category.slug)) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    catalog.categories.push(category);
    saveCatalog(catalog);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
