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

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const updatedCategory = await request.json();
    const catalog = getCatalog();

    const categoryIndex = catalog.categories.findIndex((c: any) => c.slug === params.slug);
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    catalog.categories[categoryIndex] = { ...catalog.categories[categoryIndex], ...updatedCategory };
    saveCatalog(catalog);

    return NextResponse.json(catalog.categories[categoryIndex]);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const catalog = getCatalog();

    const categoryIndex = catalog.categories.findIndex((c: any) => c.slug === params.slug);
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    catalog.categories.splice(categoryIndex, 1);
    saveCatalog(catalog);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
