import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

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

export async function GET() {
  const catalog = getCatalog();
  const products = catalog.products || [];
  const categories = catalog.categories || [];

  const totalStock = products.reduce((sum: number, p: any) => sum + (p.stockSqFt || 0), 0);
  const totalValue = products.reduce(
    (sum: number, p: any) => sum + (p.pricePerSqFt * p.stockSqFt),
    0
  );

  return NextResponse.json({
    totalProducts: products.length,
    totalCategories: categories.length,
    totalStock,
    totalValue: Math.round(totalValue * 100) / 100,
  });
}
