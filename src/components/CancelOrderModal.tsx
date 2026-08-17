"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cancelCustomerOrder } from "@/app/actions/orders";

export interface OrderCancellationTarget {
  id: string;
  status: string;
  total: string;
  items: string;
}

const COMMON_REASONS = [
  "Ordered by mistake",
  "Need to change tile specifications or quantity",
  "Found an alternative tile or design solution",
  "Delivery timeframe does not meet project schedule",
  "Other reason",
];

export function CancelOrderModal({
  open,
  order,
  onClose,
  onCancelled,
}: {
  open: boolean;
  order: OrderCancellationTarget | null;
  onClose: () => void;
  onCancelled: (
    orderId: string,
    statusDescription?: string,
    statusHistory?: Array<{
      status: string;
      description?: string | null;
      timestamp: string;
      updated_by?: string | null;
    }>,
    statusUpdatedAt?: string
  ) => void;
}) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !order) return null;

  const displayOrderId = order.id.startsWith("UN-")
    ? order.id.toUpperCase()
    : `UN-2026-${order.id.substring(0, 8).toUpperCase()}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const finalReason =
      selectedReason === "Other reason"
        ? customReason.trim() || "Order cancelled by customer."
        : customReason.trim()
        ? `${selectedReason}: ${customReason.trim()}`
        : selectedReason;

    setCancelling(true);
    setError(null);

    const result = await cancelCustomerOrder({
      orderId: order.id,
      reason: finalReason,
    });

    setCancelling(false);

    if (!result.success) {
      setError(result.error || "Could not cancel the order. Please contact support.");
      return;
    }

    onCancelled(
      order.id,
      result.statusDescription || finalReason,
      result.statusHistory,
      result.statusUpdatedAt
    );
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[230] animate-in fade-in duration-200"
        onClick={cancelling ? undefined : onClose}
      />
      <div className="fixed inset-x-4 top-[12%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-[231] p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-zinc-900 text-base">Cancel Order</h3>
              <p className="font-mono text-xs text-gray-500">#{displayOrderId}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={cancelling}
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-zinc-900 rounded-md transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold text-amber-950 mb-0.5">Please Note:</p>
            You can cancel orders while they are in <strong>Pending</strong> or <strong>Processing</strong> status. Reserved warehouse tile stock will automatically be released back to inventory.
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Reason for Cancellation
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={cancelling}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-zinc-900 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Additional Details {selectedReason === "Other reason" ? "(Required)" : "(Optional)"}
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={cancelling}
              placeholder={
                selectedReason === "Other reason"
                  ? "Please explain why you wish to cancel..."
                  : "Any additional notes or feedback for our team..."
              }
              required={selectedReason === "Other reason"}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white text-zinc-900 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={cancelling}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-zinc-700 hover:bg-gray-50 transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={cancelling}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
