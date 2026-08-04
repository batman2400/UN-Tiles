"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, AlertTriangle, Package, Search, ChevronDown, ChevronLeft, ChevronRight, Truck, Store } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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

export function OrdersTable({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string>("All");

  // Subscribe to real-time order changes across the store
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
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
    updateRowState(orderId, { isUpdating: true, feedback: null });

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      updateRowState(orderId, {
        isUpdating: false,
        feedback: { type: "error", message: error.message },
      });
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    updateRowState(orderId, {
      isUpdating: false,
      feedback: { type: "success", message: "Status updated!" },
    });

    setTimeout(() => {
      updateRowState(orderId, { feedback: null });
    }, 3000);
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
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <select 
            className="bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 py-2.5 px-3 transition-all cursor-pointer w-full md:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            className="bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 py-2.5 px-3 transition-all cursor-pointer w-full md:w-auto"
            value={deliveryMethodFilter}
            onChange={(e) => setDeliveryMethodFilter(e.target.value)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[18%] text-left">Order ID & Date</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[22%] text-left">Customer</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left">Delivery Method</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[20%] text-left">Items</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[12%] text-right">Total Price</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[13%] text-right">Status Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No orders found.
                </td>
              </tr>
            )}
            
            {filteredOrders.map((order, index) => {
              const row = getRowState(order.id);
              const delayClass = `motion-delay-${(index % 4) + 1}`;
              
              return (
                <tr key={order.id} className={`group bg-white border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-accent hover:bg-gray-50/80 transition-all motion-fade-up ${delayClass}`}>
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
                  <td className="px-6 py-3 text-right relative">
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
                      <div className={`absolute left-6 -bottom-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider motion-fade-up z-10 ${
                        row.feedback.type === "success" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {row.feedback.type === "success" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {row.feedback.message}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </p>
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded border border-gray-900 bg-gray-900 flex items-center justify-center text-white text-xs font-bold">1</button>
          <button className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
