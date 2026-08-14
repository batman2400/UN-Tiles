"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, AlertTriangle, Package, Search, ChevronDown, ChevronLeft, ChevronRight, Truck, Store, Download, Eye, X, Mail, Phone, Calendar, ListOrdered } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { downloadCsv } from "@/lib/csv";
import { updateOrderStatus, bulkUpdateOrderStatus } from "@/app/actions/admin";

export interface AdminOrder {
  id: string;
  status: string;
  items: string;
  total: string;
  delivery_method: string;
  date: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
}

interface RowState {
  isUpdating: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAGE_SIZE = 10;

export function OrdersTable({
  initialOrders,
}: {
  initialOrders: AdminOrder[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(ORDER_STATUSES[0]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);

  // Subscribe to real-time order changes across the store
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as AdminOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (deliveryMethodFilter !== "All" && o.delivery_method !== deliveryMethodFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const customerName = `${o.profiles?.first_name || ""} ${o.profiles?.last_name || ""}`.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        (o.profiles?.email || "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter, deliveryMethodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const getRowState = (id: string): RowState => {
    return rowStates[id] ?? { isUpdating: false, feedback: null };
  };

  const updateRowState = (id: string, patch: Partial<RowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRowState(id), ...patch },
    }));
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const previousStatus = orders.find((o) => o.id === orderId)?.status;
    updateRowState(orderId, { isUpdating: true, feedback: null });

    const result = await updateOrderStatus({ orderId, newStatus });

    if (!result.success) {
      updateRowState(orderId, {
        isUpdating: false,
        feedback: { type: "error", message: result.error },
      });
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const restored = previousStatus !== "Cancelled" && newStatus === "Cancelled";
    updateRowState(orderId, {
      isUpdating: false,
      feedback: {
        type: "success",
        message: restored ? "Cancelled — stock restored." : "Status updated!",
      },
    });

    setTimeout(() => {
      updateRowState(orderId, { feedback: null });
    }, 3000);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        paginatedOrders.forEach((o) => next.delete(o.id));
      } else {
        paginatedOrders.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);

    const ids = Array.from(selectedIds);
    const result = await bulkUpdateOrderStatus({ orderIds: ids, newStatus: bulkStatus });

    if (!result.success) {
      setIsBulkUpdating(false);
      return;
    }

    const succeeded = new Set(result.succeededIds);
    setOrders((prev) =>
      prev.map((o) => (succeeded.has(o.id) ? { ...o, status: bulkStatus } : o))
    );
    setSelectedIds(new Set(result.failed.map((f) => f.id)));

    setIsBulkUpdating(false);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order ID", "Date", "Customer Name", "Email", "Phone", "Delivery Method", "Items", "Total", "Status"],
      filteredOrders.map((o) => [
        o.id,
        new Date(o.date).toLocaleString(),
        `${o.profiles?.first_name || ""} ${o.profiles?.last_name || ""}`.trim(),
        o.profiles?.email || "",
        o.profiles?.phone || "",
        o.delivery_method,
        o.items,
        o.total,
        o.status,
      ])
    );
  };

  const formatCurrency = (amountStr: string): string => {
    if (amountStr.includes("LKR") || amountStr.includes("Rs")) return amountStr;
    const num = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
    if (isNaN(num)) return amountStr;
    
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200/60';
      default: return 'bg-gray-50 text-gray-700 border-gray-200/60';
    }
  };

  return (
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order Fulfillment</h2>
          <p className="text-sm text-gray-500 mt-1">Cancelling an order returns its deducted stock to inventory.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <select 
            className="bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 py-2.5 px-3 transition-all cursor-pointer w-full md:w-auto"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            className="bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 py-2.5 px-3 transition-all cursor-pointer w-full md:w-auto"
            value={deliveryMethodFilter}
            onChange={(e) => {
              setDeliveryMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Delivery Methods</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="Pickup from Store">Pickup from Store</option>
          </select>
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, name, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
          <button
            onClick={handleExportCsv}
            title="Export currently filtered orders to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors w-full md:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-3 bg-zinc-900 text-white rounded-xl px-5 py-3 motion-fade-up">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">
                  {s === "Cancelled" ? "Cancelled (restore stock)" : s}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-accent text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {isBulkUpdating ? "Updating..." : "Apply Status"}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 w-[3%]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-accent"
                  aria-label="Select all visible orders"
                />
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[16%] text-left">Order ID & Date</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[20%] text-left">Customer</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[14%] text-left">Delivery Method</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[18%] text-left">Items</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[11%] text-right">Total Price</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[13%] text-right">Status Action</th>
              <th className="px-4 py-3 w-[5%] text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">View</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No orders found.
                </td>
              </tr>
            )}
            
            {paginatedOrders.map((order, index) => {
              const row = getRowState(order.id);
              const delayClass = `motion-delay-${(index % 4) + 1}`;
              
              return (
                <tr key={order.id} className={`group bg-white border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-accent hover:bg-gray-50/80 transition-all motion-fade-up ${delayClass}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelected(order.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-accent"
                      aria-label={`Select order ${order.id}`}
                    />
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="font-mono text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
                      {order.id.startsWith("UN-") 
                        ? `#${order.id.substring(0, 18).toUpperCase()}` 
                        : `#UN-2026-${order.id.substring(0, 8).toUpperCase()}`}
                    </span>
                    <div className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-wider">
                      {new Date(order.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {order.profiles?.first_name} {order.profiles?.last_name}
                      </span>
                      <span className="text-xs text-gray-500">{order.profiles?.email}</span>
                      {order.profiles?.phone && (
                        <span className="text-xs text-gray-500">{order.profiles.phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      {order.delivery_method === "Cash on Delivery" ? (
                        <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                        {order.delivery_method || "Pickup"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="text-[13px] font-medium text-gray-600 max-w-[200px] truncate" title={order.items}>
                      {order.items}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="relative inline-block w-40 group/select">
                        <select
                          value={order.status}
                          disabled={row.isUpdating}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`w-full appearance-none px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md border outline-none cursor-pointer disabled:opacity-50 transition-all ${getStatusBadgeColor(order.status)}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60 group-hover/select:opacity-100 transition-opacity" />
                      </div>
                      
                      {row.feedback && (
                        <div className={`flex items-center justify-start w-40 px-1 gap-1.5 text-[10px] font-bold uppercase tracking-wider motion-fade-up ${
                          row.feedback.type === "success" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {row.feedback.type === "success" ? (
                            <CheckCircle className="w-3 h-3 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate">{row.feedback.message}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setViewOrder(order)}
                      title="View full order details"
                      className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Showing {paginatedOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}{" "}
          {filteredOrders.length === 1 ? "order" : "orders"}
        </p>
        <div className="flex gap-1">
          <button
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-8 h-8 rounded border border-gray-900 bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
            {currentPage}
          </span>
          <button
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
            onClick={() => setViewOrder(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 sticky top-0">
              <div>
                <h3 className="font-bold text-gray-900">Order Details</h3>
                <p className="font-mono text-xs text-gray-500 mt-0.5">
                  {viewOrder.id.startsWith("UN-")
                    ? `#${viewOrder.id.substring(0, 18).toUpperCase()}`
                    : `#UN-2026-${viewOrder.id.substring(0, 8).toUpperCase()}`}
                </p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <span className={`inline-flex self-start px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-widest ${getStatusBadgeColor(viewOrder.status)}`}>
                {viewOrder.status}
              </span>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {viewOrder.profiles?.first_name} {viewOrder.profiles?.last_name}
                  </p>
                  {viewOrder.profiles?.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{viewOrder.profiles.email}</p>
                  )}
                  {viewOrder.profiles?.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{viewOrder.profiles.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Info</p>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(viewOrder.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="flex items-center gap-2">
                    {viewOrder.delivery_method === "Cash on Delivery" ? <Truck className="w-3.5 h-3.5 text-gray-400" /> : <Store className="w-3.5 h-3.5 text-gray-400" />}
                    {viewOrder.delivery_method || "Pickup from Store"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5" /> Items
                </p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {viewOrder.items}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="font-mono text-xl font-bold text-gray-900">{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
