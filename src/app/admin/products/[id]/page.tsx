'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  name: string;
  dimensions: string;
  pricePerSqFt: number;
  image: string;
  categorySlug: string;
  featured: boolean;
  finish: string;
  application: string;
  stockSqFt: number;
}

interface Category {
  slug: string;
  name: string;
}

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isNew = productId === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product>({
    id: '',
    sku: '',
    name: '',
    dimensions: '',
    pricePerSqFt: 0,
    image: '',
    categorySlug: '',
    featured: false,
    finish: '',
    application: '',
    stockSqFt: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catRes = await fetch('/api/admin/categories');
        const cats = await catRes.json();
        setCategories(cats);

        // Fetch product if editing
        if (!isNew) {
          const prodRes = await fetch(`/api/admin/products/${productId}`);
          const prod = await prodRes.json();
          setProduct(prod);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, isNew]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${productId}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (!response.ok) throw new Error('Failed to save product');

      alert(isNew ? 'Product created successfully!' : 'Product updated successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Products
      </Link>

      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-gray-900 mb-6">
          {isNew ? 'Add New Product' : 'Edit Product'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={product.sku}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Dimensions *
              </label>
              <input
                type="text"
                name="dimensions"
                value={product.dimensions}
                onChange={handleChange}
                placeholder="e.g., 60x60cm"
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Price per Sq Ft *
              </label>
              <input
                type="number"
                name="pricePerSqFt"
                value={product.pricePerSqFt}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Stock (sq ft) *
              </label>
              <input
                type="number"
                name="stockSqFt"
                value={product.stockSqFt}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Category *
              </label>
              <select
                name="categorySlug"
                value={product.categorySlug}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Finish
              </label>
              <input
                type="text"
                name="finish"
                value={product.finish}
                onChange={handleChange}
                placeholder="e.g., Polished"
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                Application
              </label>
              <input
                type="text"
                name="application"
                value={product.application}
                onChange={handleChange}
                placeholder="e.g., Interior"
                className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Image URL
            </label>
            <input
              type="text"
              name="image"
              value={product.image}
              onChange={handleChange}
              placeholder="/images/..."
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              checked={product.featured}
              onChange={handleChange}
              id="featured"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-900">
              Featured Product
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold tracking-wide uppercase text-xs flex items-center justify-center"
            >
              {submitting ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-2 bg-blue-50 text-blue-900 border border-blue-100 rounded hover:bg-blue-100 transition-colors font-semibold tracking-wide uppercase text-xs flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
