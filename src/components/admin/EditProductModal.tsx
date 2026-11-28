"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { updateProduct } from "@/app/actions/admin";
import { createClient } from "@/utils/supabase/client";
import { useModalBehavior } from "@/hooks/useModalBehavior";

const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface EditableProduct {
  id: string;
  sku: string;
  name: string;
  stock_sqft: number;
  price_per_sqft: number;
  category_slug: string;
  image: string;
  dimensions?: string;
  finish?: string;
  application?: string;
}

export function EditProductModal({
  product,
  categories,
  onClose,
  onUpdated,
}: {
  product: EditableProduct;
  categories: { name: string; slug: string }[];
  onClose: () => void;
  onUpdated: (updated: EditableProduct) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: product.sku,
    name: product.name,
    category_slug: product.category_slug,
    dimensions: product.dimensions || "60x60 cm",
    price_per_sqft: String(product.price_per_sqft),
    image: product.image || "",
    finish: product.finish || "Matte",
    application: product.application || "Interior",
  });

  useModalBehavior(true, onClose, isSubmitting);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!ALLOWED_UPLOAD_TYPES[file.type]) {
        setError("Please select a JPEG, PNG, or WebP image.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError("Image must be 5 MB or smaller.");
        e.target.value = "";
        return;
      }
      setError(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const price = parseFloat(formData.price_per_sqft) || 0;
    if (!formData.name.trim() || !formData.sku.trim() || !formData.category_slug || price <= 0) {
      setError("Please fill out all required fields properly.");
      setIsSubmitting(false);
      return;
    }

    let imageUrl = formData.image.trim();
    let uploadedFilePath: string | null = null;

    try {
      if (imageFile) {
        const ext = ALLOWED_UPLOAD_TYPES[imageFile.type];
        if (!ext || imageFile.size > MAX_UPLOAD_BYTES) {
          setError("Please upload a valid JPEG, PNG, or WebP image under 5 MB.");
          return;
        }

        const supabase = createClient();
        const filePath = `product-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile, { contentType: imageFile.type });

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`);
          return;
        }

        uploadedFilePath = filePath;
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const res = await updateProduct({
        id: product.id,
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category_slug: formData.category_slug,
        dimensions: formData.dimensions.trim(),
        price_per_sqft: price,
        image: imageUrl || undefined,
        finish: formData.finish.trim(),
        application: formData.application.trim(),
      });

      if (!res.success) {
        if (uploadedFilePath) {
          const supabase = createClient();
          await supabase.storage.from("products").remove([uploadedFilePath]).catch(() => {});
        }
        setError(res.error || "Failed to update product.");
        return;
      }

      onUpdated({
        ...product,
        ...res.product,
      });
      onClose();
    } catch {
      if (uploadedFilePath) {
        const supabase = createClient();
        await supabase.storage.from("products").remove([uploadedFilePath]).catch(() => {});
      }
      setError("Could not update product. Please check your session and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-[fade-in_0.2s_ease-out]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-modal-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] max-w-2xl bg-white rounded-2xl shadow-2xl z-[201] animate-[scale-in_0.2s_ease-out] overflow-hidden flex flex-col max-h-[min(90vh,100dvh-1.5rem)]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 id="edit-product-modal-title" className="font-bold text-gray-900">Edit Product</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors disabled:opacity-50"
            aria-label="Close"
          >
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
                {categories.map((c) => (
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
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price / SqFt (LKR)</label>
              <input
                type="number"
                name="price_per_sqft"
                required
                min={1}
                value={formData.price_per_sqft}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Finish</label>
              <input
                type="text"
                name="finish"
                value={formData.finish}
                onChange={handleChange}
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
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Replace Product Image <span className="font-normal text-gray-400 lowercase">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-accent hover:file:text-black cursor-pointer"
            />
            {(imagePreview || formData.image) && (
              <div className="mt-3 relative flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview || formData.image}
                  alt={formData.name || "Product preview"}
                  className="w-14 h-14 object-cover rounded-md border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {imageFile ? imageFile.name : formData.image}
                  </p>
                  {imageFile && (
                    <p className="text-[11px] text-gray-500">
                      {(imageFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                {imageFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Discard new upload"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-accent hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
