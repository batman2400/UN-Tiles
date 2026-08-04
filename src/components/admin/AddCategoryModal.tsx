"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createCategory } from "@/app/actions/admin";

export function AddCategoryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await createCategory({ name, slug, image });

    if (!res.success) {
      setError(res.error || "Failed to create category");
      setIsSubmitting(false);
    } else {
      setIsOpen(false);
      setName("");
      setSlug("");
      setImage("");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Category
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-[fade-in_0.2s_ease-out]"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[101] animate-[scale-in_0.2s_ease-out] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Add New Category</h3>
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

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Wood Tiles"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. wood-tiles"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
            <input
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/images/tiles/..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Absolute path (e.g., /images/tiles/cat.png)</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 bg-zinc-900 text-white font-bold rounded-lg hover:bg-accent hover:text-black transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:bg-zinc-900 disabled:hover:text-white"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Category"}
          </button>
        </form>
      </div>
    </>
  );
}
