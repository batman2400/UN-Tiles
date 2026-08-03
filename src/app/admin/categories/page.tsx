'use client';

import { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  image: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', image: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.slug) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create category');

      alert('Category created successfully!');
      setFormData({ name: '', slug: '', image: '' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdate = async (slug: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update category');

      alert('Category updated successfully!');
      setEditingId(null);
      setFormData({ name: '', slug: '', image: '' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-medium tracking-tight text-gray-900 mb-8">Categories</h1>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-display font-medium text-gray-900 mb-6">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Slug (e.g., floor-tiles)"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              disabled={!!editingId}
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400 disabled:opacity-50 disabled:border-dashed"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-600 outline-none py-2 text-gray-900 transition-colors rounded-none placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2">
            {editingId ? (
              <>
                <button
                  onClick={() => handleUpdate(editingId)}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold tracking-wide uppercase text-xs"
                >
                  Update Category
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', slug: '', image: '' });
                  }}
                  className="px-6 py-2 bg-blue-50 text-blue-900 border border-blue-100 rounded hover:bg-blue-100 transition-colors font-semibold tracking-wide uppercase text-xs"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold tracking-wide uppercase text-xs"
              >
                <Plus size={16} />
                Add Category
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No categories found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.slug} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {category.image}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(category.slug);
                            setFormData(category);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.slug)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
