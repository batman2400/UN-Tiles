"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  CheckCircle, AlertTriangle, Package, Search, ChevronDown, ChevronLeft, ChevronRight, 
  Truck, Store, Download, Eye, X, Mail, Phone, Calendar, ListOrdered, MapPin, 
  MessageSquare, MessageSquareQuote, Clock, Sparkles, History, Check,
  ArrowRight, ShieldAlert, ShieldCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { downloadCsv } from "@/lib/csv";
import { formatAddressSnapshot, type AddressSnapshot } from "@/lib/address";
import { updateOrderStatus, bulkUpdateOrderStatus } from "@/app/actions/admin";

export interface StatusHistoryItem {
  status: string;
  description?: string | null;
  timestamp: string;
  updated_by?: string | null;
}

export interface AdminOrder {
  id: string;
  status: string;
  status_description: string | null;
  status_history: StatusHistoryItem[];
  status_updated_at: string | null;
  items: string;
  total: string;
  delivery_method: string;
  delivery_address: AddressSnapshot | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_details?: Record<string, unknown> | null;
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

interface StatusModalState {
  orderId: string;
  currentStatus: string;
  targetStatus: string;
  description: string;
  customerName: string;
  orderDisplayId: string;
}

interface BulkModalState {
  targetStatus: string;
  description: string;
  orderIds: string[];
}

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAGE_SIZE = 10;

const STATUS_PRESETS: Record<string, string[]> = {
  Processing: [
    "Order confirmed and queued for tile precision cutting.",
    "Tile batch retrieved from warehouse inventory and undergoing quality check.",
    "Order is being prepared and palletized for collection/dispatch.",
  ],
  Shipped: [
    "Dispatched via freight courier logistics. Tracking details attached.",
    "Out for direct delivery to specified job site/address today.",
    "Shipment handed over to regional carrier; estimated arrival in 1–2 business days.",
  ],
  Delivered: [
    "Order safely delivered to recipient and signed on site.",
    "Order collected in person from UN Tiles flagship showroom.",
    "Delivery completed successfully.",
  ],
  Cancelled: [
    "Order cancelled per customer request. Deducted stock restored to inventory.",
    "Order cancelled due to duplicate submission. Stock restored.",
    "Order cancelled. Please contact customer support for further assistance.",
  ],
  Pending: [
    "Order placed and awaiting verification by UN Tiles fulfillment team.",
    "Awaiting confirmation of custom cutting specifications.",
  ],
};

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

  // Status Update Modal State (single order)
  const [statusModal, setStatusModal] = useState<StatusModalState | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Bulk Status Update Modal State
  const [bulkModal, setBulkModal] = useState<BulkModalState | null>(null);

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
            setViewOrder((prev) =>
              prev && prev.id === payload.new.id ? { ...prev, ...payload.new } : prev
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            setViewOrder((prev) => (prev && prev.id === payload.old.id ? null : prev));
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
        (o.profiles?.email || "").toLowerCase().includes(q) ||
        (o.status_description || "").toLowerCase().includes(q)
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

  const openStatusModal = (order: AdminOrder, targetStatus: string) => {
    const customerName = `${order.profiles?.first_name || ""} ${order.profiles?.last_name || ""}`.trim() || order.profiles?.email || "Customer";
    const orderDisplayId = order.id.startsWith("UN-") 
      ? `#${order.id.substring(0, 18).toUpperCase()}` 
      : `#UN-2026-${order.id.substring(0, 8).toUpperCase()}`;

    setStatusModal({
      orderId: order.id,
      currentStatus: order.status,
      targetStatus,
      description: order.status === targetStatus ? (order.status_description || "") : "",
      customerName,
      orderDisplayId,
    });
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusModal) return;
    const { orderId, targetStatus, description, currentStatus } = statusModal;
    setIsSubmittingStatus(true);
    updateRowState(orderId, { isUpdating: true, feedback: null });

    const result = await updateOrderStatus({
      orderId,
      newStatus: targetStatus,
      statusDescription: description.trim() || null,
    });

    setIsSubmittingStatus(false);

    if (!result.success) {
      updateRowState(orderId, {
        isUpdating: false,
        feedback: { type: "error", message: result.error },
      });
      return;
    }

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: targetStatus,
          status_description: result.statusDescription ?? null,
          status_history: result.statusHistory ?? o.status_history,
          status_updated_at: result.statusUpdatedAt ?? new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updatedOrders);

    if (viewOrder && viewOrder.id === orderId) {
      setViewOrder((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus,
              status_description: result.statusDescription ?? null,
              status_history: result.statusHistory ?? prev.status_history,
              status_updated_at: result.statusUpdatedAt ?? new Date().toISOString(),
            }
          : null
      );
    }

    const restored = currentStatus !== "Cancelled" && targetStatus === "Cancelled";
    updateRowState(orderId, {
      isUpdating: false,
      feedback: {
        type: "success",
        message: restored ? "Cancelled — stock restored." : "Status updated!",
      },
    });

    setStatusModal(null);

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

  const openBulkModal = () => {
    if (selectedIds.size === 0) return;
    setBulkModal({
      targetStatus: bulkStatus,
      description: "",
      orderIds: Array.from(selectedIds),
    });
  };

  const handleConfirmBulkUpdate = async () => {
    if (!bulkModal) return;
    setIsBulkUpdating(true);

    const { orderIds, targetStatus, description } = bulkModal;
    const result = await bulkUpdateOrderStatus({
      orderIds,
      newStatus: targetStatus,
      statusDescription: description.trim() || null,
    });

    setIsBulkUpdating(false);

    if (!result.success) {
      return;
    }

    const succeeded = new Set(result.succeededIds);
    setOrders((prev) =>
      prev.map((o) =>
        succeeded.has(o.id)
          ? {
              ...o,
              status: targetStatus,
              status_description: description.trim() || null,
              status_updated_at: new Date().toISOString(),
            }
          : o
      )
    );
    setSelectedIds(new Set(result.failed.map((f) => f.id)));
    setBulkModal(null);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Order ID",
        "Date",
        "Customer Name",
        "Email",
        "Phone",
        "Delivery Method",
        "Delivery Address",
        "Payment Status",
        "Payment Method",
        "Transaction ID",
        "Items",
        "Total",
        "Status",
        "Status Description"
      ],
      filteredOrders.map((o) => [
        o.id,
        new Date(o.date).toLocaleString(),
        `${o.profiles?.first_name || ""} ${o.profiles?.last_name || ""}`.trim(),
        o.profiles?.email || "",
        o.profiles?.phone || "",
        o.delivery_method,
        formatAddressSnapshot(o.delivery_address),
        o.payment_status || "Pending",
        o.payment_method || "Cash on Delivery",
        o.payment_details ? String((o.payment_details as Record<string, unknown>).transaction_id || "") : "",
        o.items,
        o.total,
        o.status,
        o.status_description || "",
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
          <p className="text-sm text-gray-500 mt-1">Update order progress and attach status notes visible to customers.</p>
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
              placeholder="Search ID, name, note..."
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
              onClick={openBulkModal}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-accent text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              Apply Status & Note
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
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[16%] text-left">Items & Note</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[11%] text-right">Total Price</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right">Status Action</th>
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
                    {order.delivery_method === "Cash on Delivery" && order.delivery_address && (
                      <p className="text-[11px] text-gray-500 mt-1 max-w-[180px] truncate" title={formatAddressSnapshot(order.delivery_address)}>
                        {formatAddressSnapshot(order.delivery_address)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="text-[13px] font-medium text-gray-600 max-w-[200px] truncate" title={order.items}>
                      {order.items}
                    </div>
                    {order.status_description ? (
                      <button
                        onClick={() => openStatusModal(order, order.status)}
                        title={order.status_description}
                        className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/60 max-w-[200px] transition-colors text-left"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        <span className="truncate font-medium">{order.status_description}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openStatusModal(order, order.status)}
                        className="mt-1 text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>+ Add note</span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-gray-900 block">
                      {formatCurrency(order.total)}
                    </span>
                    {order.payment_status === "Paid" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 mt-1">
                        <ShieldCheck className="w-3 h-3" /> Paid (Sandbox)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/60 mt-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="relative inline-block w-40 group/select">
                        <select
                          value={order.status}
                          disabled={row.isUpdating}
                          onChange={(e) => openStatusModal(order, e.target.value)}
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

      {/* ── Status Update Confirmation Modal ──────────────────────── */}
      {statusModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[220] animate-in fade-in duration-200"
            onClick={() => { if (!isSubmittingStatus) setStatusModal(null); }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[221] p-6 animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Update Order Status
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Order <span className="font-mono font-semibold text-gray-800">{statusModal.orderDisplayId}</span> • {statusModal.customerName}
                </p>
              </div>
              <button
                disabled={isSubmittingStatus}
                onClick={() => setStatusModal(null)}
                className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transition Badge Pill */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current</span>
                <span className={`inline-flex px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeColor(statusModal.currentStatus)}`}>
                  {statusModal.currentStatus}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">New Target</span>
                <div className="relative">
                  <select
                    value={statusModal.targetStatus}
                    onChange={(e) => setStatusModal((prev) => prev ? { ...prev, targetStatus: e.target.value } : null)}
                    className={`appearance-none px-3 py-1 pr-7 rounded-md border text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer ${getStatusBadgeColor(statusModal.targetStatus)}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                </div>
              </div>
            </div>

            {/* Cancellation Warning */}
            {statusModal.targetStatus === "Cancelled" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Inventory Stock Restoration</p>
                  <p className="text-[11px] text-red-700/90 mt-0.5">Cancelling this order will automatically restore all reserved tile stock back into warehouse inventory.</p>
                </div>
              </div>
            )}

            {/* Quick Preset Buttons */}
            {STATUS_PRESETS[statusModal.targetStatus] && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quick Templates</span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_PRESETS[statusModal.targetStatus].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatusModal((prev) => prev ? { ...prev, description: preset } : null)}
                      className="text-[11px] bg-gray-100 hover:bg-yellow-100 hover:text-yellow-900 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200/80 transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-yellow-600" />
                  Status Description / Note
                </label>
                <span className="text-[11px] text-gray-400">{statusModal.description.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={statusModal.description}
                onChange={(e) => setStatusModal((prev) => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter details for the customer (e.g. tracking number, dispatch update, or reasons)..."
                className="w-full text-sm text-gray-900 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              />
              <p className="text-[11px] text-gray-400">This description will be immediately visible to the customer on their order history page.</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isSubmittingStatus}
                onClick={() => setStatusModal(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingStatus}
                onClick={handleConfirmStatusUpdate}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingStatus ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Update
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Bulk Status Update Modal ───────────────────────────────── */}
      {bulkModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[220] animate-in fade-in duration-200"
            onClick={() => { if (!isBulkUpdating) setBulkModal(null); }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[221] p-6 animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Bulk Update ({bulkModal.orderIds.length} Orders)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Applying new status: <span className="font-bold text-gray-900">{bulkModal.targetStatus}</span>
                </p>
              </div>
              <button
                disabled={isBulkUpdating}
                onClick={() => setBulkModal(null)}
                className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkModal.targetStatus === "Cancelled" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px]">Cancelling these orders will return all their deducted stock back to inventory.</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-yellow-600" />
                Status Note for Selected Orders (Optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={bulkModal.description}
                onChange={(e) => setBulkModal((prev) => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Attach a note for all selected customers..."
                className="w-full text-sm text-gray-900 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => setBulkModal(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={handleConfirmBulkUpdate}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isBulkUpdating ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Updating {bulkModal.orderIds.length} Orders...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Apply to {bulkModal.orderIds.length} Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Order Details Side Drawer ──────────────────────────────── */}
      {viewOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
            onClick={() => setViewOrder(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
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
              {/* Status Header & Action Button */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Status</span>
                  <span className={`inline-flex px-3 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeColor(viewOrder.status)}`}>
                    {viewOrder.status}
                  </span>
                </div>

                {viewOrder.status_description && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
                      Latest Status Note
                    </span>
                    <p className="leading-relaxed font-medium">{viewOrder.status_description}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openStatusModal(viewOrder, viewOrder.status)}
                  className="w-full mt-1 py-2 px-3 bg-white hover:bg-yellow-50 text-gray-900 hover:text-yellow-900 border border-gray-200 hover:border-yellow-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  Update Status / Add Note
                </button>
              </div>

              {/* Status History Timeline */}
              {viewOrder.status_history && viewOrder.status_history.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Status Timeline History
                  </p>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {viewOrder.status_history.slice().reverse().map((entry, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-yellow-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getStatusBadgeColor(entry.status)}`}>
                              {entry.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(entry.timestamp).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-gray-700 mt-2 font-medium leading-relaxed">
                              {entry.description}
                            </p>
                          )}
                          {entry.updated_by && (
                            <span className="text-[9px] text-gray-400 mt-1 block">by {entry.updated_by}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Details</p>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Payment Status</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      viewOrder.payment_status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {viewOrder.payment_status === "Paid" ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Paid (Online Sandbox)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Payment Pending</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Method</span>
                    <span className="font-semibold text-gray-900">{viewOrder.payment_method || "Cash on Delivery"}</span>
                  </div>
                  {viewOrder.payment_details && Boolean((viewOrder.payment_details as Record<string, unknown>).transaction_id) && (
                    <div className="mt-2 pt-2 border-t border-gray-100 font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Txn Reference:</span>
                        <span className="text-gray-900 font-bold">{String((viewOrder.payment_details as Record<string, unknown>).transaction_id)}</span>
                      </div>
                      {Boolean((viewOrder.payment_details as Record<string, unknown>).auth_code) && (
                        <div className="flex justify-between text-gray-500">
                          <span>Auth Code:</span>
                          <span className="text-gray-800">{String((viewOrder.payment_details as Record<string, unknown>).auth_code)}</span>
                        </div>
                      )}
                      {Boolean((viewOrder.payment_details as Record<string, unknown>).card_brand) && (
                        <div className="flex justify-between text-gray-500">
                          <span>Card:</span>
                          <span className="text-gray-800">
                            {String((viewOrder.payment_details as Record<string, unknown>).card_brand)} •••• {String((viewOrder.payment_details as Record<string, unknown>).last4 ?? "")}
                          </span>
                        </div>
                      )}
                    </div>
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

              {viewOrder.delivery_method === "Cash on Delivery" && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                    {viewOrder.delivery_address?.line1 ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          {viewOrder.delivery_address.label && (
                            <p className="font-semibold text-gray-900">{viewOrder.delivery_address.label}</p>
                          )}
                          <p>{viewOrder.delivery_address.line1}</p>
                          {viewOrder.delivery_address.line2 && <p>{viewOrder.delivery_address.line2}</p>}
                          {viewOrder.delivery_address.country && <p>{viewOrder.delivery_address.country}</p>}
                        </div>
                      </div>
                    ) : (
                      <p>No delivery address on this order.</p>
                    )}
                  </div>
                </div>
              )}

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
