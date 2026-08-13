"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createProduct } from "@/app/actions/admin";
import { createClient } from "@/utils/supabase/client";
export function AddProductModal({ categories }: { categories: { name: string, slug: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category_slug: categories.length > 0 ? categories[0].slug : "",
    dimensions: "60x60 cm",
    price_per_sqft: "",
    image: "",
    finish: "Matte",
    application: "Interior",
    stock_sqft: "1000",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const data = {
      ...formData,
      price_per_sqft: parseFloat(formData.price_per_sqft) || 0,
      stock_sqft: parseFloat(formData.stock_sqft) || 0
    };

    if (!data.name || !data.sku || !data.category_slug || data.price_per_sqft <= 0) {
      setError("Please fill out all required fields properly.");
      setIsSubmitting(false);
      return;
    }

    let imageUrl = formData.image;
    if (imageFile) {
      const supabase = createClient();
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, imageFile);

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
      data.image = imageUrl;
    }

    const res = await createProduct(data);

    if (!res.success) {
      setError(res.error || "Failed to create product");
      setIsSubmitting(false);
    } else {
      setIsOpen(false);
      // Reset form
      setFormData({
        sku: "",
        name: "",
        category_slug: categories.length > 0 ? categories[0].slug : "",
        dimensions: "60x60 cm",
        price_per_sqft: "",
        image: "",
        finish: "Matte",
        application: "Interior",
        stock_sqft: "1000",
      });
      setImageFile(null);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold tracking-wide hover:bg-accent hover:text-black transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Product
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-[fade-in_0.2s_ease-out]"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] max-w-2xl bg-white rounded-2xl shadow-2xl z-[201] animate-[scale-in_0.2s_ease-out] overflow-hidden flex flex-col max-h-[min(90vh,100dvh-1.5rem)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Add New Product</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200/50">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Royal Sapphire Tile"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. UN-XYZ-123"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                name="category_slug"
                required
                value={formData.category_slug}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dimensions</label>
              <input
                type="text"
                name="dimensions"
                required
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="e.g. 60x60 cm"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price / SqFt (LKR)</label>
              <input
                type="number"
                name="price_per_sqft"
                required
                min={0}
                value={formData.price_per_sqft}
                onChange={handleChange}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Initial Stock (SqFt)</label>
              <input
                type="number"
                name="stock_sqft"
                required
                min={0}
                value={formData.stock_sqft}
                onChange={handleChange}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Finish</label>
              <input
                type="text"
                name="finish"
                value={formData.finish}
                onChange={handleChange}
                placeholder="e.g. Matte, Glossy"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Application</label>
              <input
                type="text"
                name="application"
                value={formData.application}
                onChange={handleChange}
                placeholder="e.g. Interior, Exterior"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-accent hover:file:text-black cursor-pointer"
            />
            {imageFile && (
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full py-3 bg-zinc-900 text-white font-bold rounded-lg hover:bg-accent hover:text-black transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Product"}
          </button>
        </form>
      </div>
    </>
  );
}
