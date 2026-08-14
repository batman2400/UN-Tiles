"use client";

import { FormEvent, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { createAddress } from "@/app/actions/addresses";
import type { SavedAddress } from "@/lib/address";

export function AddAddressModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (address: SavedAddress) => void;
}) {
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!line1.trim()) {
      setError("Enter a street address.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await createAddress({
      label,
      line1,
      line2,
    });

    setSaving(false);

    if (!result.success || !result.address) {
      setError(result.error || "Could not save the address.");
      return;
    }

    setLabel("Home");
    setLine1("");
    setLine2("");
    onSaved(result.address);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[220]"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[12%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-[221] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yellow-500" />
            <h3 className="font-display font-bold text-zinc-900">Add Delivery Address</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-zinc-900 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (Home, Studio)"
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-yellow-500 bg-white"
          />
          <input
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Street address"
            required
            autoFocus
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-yellow-500 bg-white"
          />
          <input
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apartment, landmark (optional)"
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-yellow-500 bg-white"
          />
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Country: Sri Lanka</p>

          {error && (
            <p className="text-xs font-semibold text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3 text-xs uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Address"
            )}
          </button>
        </form>
      </div>
    </>
  );
}
