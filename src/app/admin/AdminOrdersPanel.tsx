"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertTriangle, Package, Search, ChevronDown, Package2, TrendingUp, CheckCircle2, MoreVertical, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { AdminOrder } from "./page";

// ── Types ──────────────────────────────────────────────

interface RowState {
  isUpdating: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// ── Component ──────────────────────────────────────────

export function AdminOrdersPanel({
  initialOrders,
  lowStockCount,
}: {
  initialOrders: AdminOrder[];
  lowStockCount: number;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status Filter
      if (statusFilter !== "All" && o.status !== statusFilter) return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const customerName = `${o.profiles?.first_name || ""} ${o.profiles?.last_name || ""}`.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        (o.profiles?.email || "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const getRowState = (id: string): RowState => {
    return (
      rowStates[id] ?? {
        isUpdating: false,
        feedback: null,
      }
    );
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

    // Update local state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    updateRowState(orderId, {
      isUpdating: false,
      feedback: { type: "success", message: "Status updated" },
    });

    // Clear feedback after 3s
    setTimeout(() => {
      updateRowState(orderId, { feedback: null });
    }, 3000);
  };

  const formatCurrency = (amountStr: string): string => {
    // If it's already formatted, just return it
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

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div className="w-full">
      {/* Stats Section (Glassmorphic) */}
      <section className="pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Orders */}
          <div className="glass-card p-8 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Total Orders</span>
              <Package2 className="text-primary w-5 h-5" />
            </div>
            <div>
              <div className="text-4xl font-display font-black tracking-tighter text-on-background">{orders.length}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live Data
              </div>
            </div>
          </div>
          
          {/* Pending Orders */}
          <div className="glass-card p-8 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Pending Orders</span>
              <AlertTriangle className="text-on-surface-variant w-5 h-5" />
            </div>
            <div>
              <div className="text-4xl font-display font-black tracking-tighter text-on-background">{pendingOrders}</div>
              <div className="text-[10px] text-on-surface-variant font-bold mt-1">Awaiting verification</div>
            </div>
          </div>
          
          {/* Low Stock SKUs */}
          <div className="glass-card p-8 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Low Stock SKUs</span>
              <AlertTriangle className="text-error w-5 h-5" />
            </div>
            <div>
              <div className="text-4xl font-display font-black tracking-tighter text-on-background">
                {lowStockCount.toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] text-error font-bold mt-1">Action required immediately</div>
            </div>
          </div>
          
          {/* Completed Orders */}
          <div className="glass-card p-8 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Completed Orders</span>
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
            </div>
            <div>
              <div className="text-4xl font-display font-black tracking-tighter text-on-background">{completedOrders}</div>
              <div className="text-[10px] text-on-surface-variant font-bold mt-1">Successfully fulfilled</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Section: Data Table */}
      <section className="pb-24">
        <div className="bg-white border border-outline-variant/5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-surface-container-low/50 gap-4">
            <div className="flex gap-4">
              {['All', 'Pending', 'Processing', 'Shipped'].map(status => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-[10px] font-bold uppercase tracking-widest pb-1 transition-colors ${
                    statusFilter === status 
                    ? "text-on-background border-b-2 border-primary" 
                    : "text-on-surface-variant hover:text-on-background"
                  }`}
                >
                  {status === 'All' ? 'All Orders' : `In ${status}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search orders, clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary/20 text-xs w-full pl-10 py-2.5 tracking-tight font-body outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <tr>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Order ID</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Customer</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Delivery</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Items</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Total Price</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-10 h-10 mx-auto mb-4 text-on-surface-variant opacity-40" />
                      <p className="text-sm text-on-surface-variant">
                        {searchQuery || statusFilter !== "All" ? "No orders match your filters." : "No orders found."}
                      </p>
                    </td>
                  </tr>
                )}
                
                {filteredOrders.map((order) => {
                  const row = getRowState(order.id);
                  
                  return (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-5 px-6">
                        <span className="font-mono text-xs text-on-surface">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <div className="text-[10px] text-on-surface-variant mt-1">
                          {new Date(order.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div>
                          <p className="text-xs font-bold text-on-background">
                            {order.profiles?.first_name} {order.profiles?.last_name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {order.profiles?.email}
                          </p>
                          {order.profiles?.phone && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              {order.profiles.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 whitespace-nowrap">
                          {order.delivery_method || "Pickup from Store"}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="text-xs text-on-surface-variant max-w-[200px] truncate" title={order.items}>
                          {order.items}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-display font-bold text-xs whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="py-5 px-6 relative">
                        <select
                          value={order.status}
                          disabled={row.isUpdating}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`status-select bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer disabled:opacity-50 appearance-none pr-6 ${
                            order.status === 'Pending' ? 'text-slate-400' :
                            order.status === 'Processing' ? 'text-indigo-500' :
                            order.status === 'Shipped' ? 'text-emerald-500' :
                            order.status === 'Delivered' ? 'text-slate-900' :
                            'text-red-500'
                          }`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-surface text-on-surface">{s}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${
                            order.status === 'Pending' ? 'text-slate-400' :
                            order.status === 'Processing' ? 'text-indigo-500' :
                            order.status === 'Shipped' ? 'text-emerald-500' :
                            order.status === 'Delivered' ? 'text-slate-900' :
                            'text-red-500'
                          }`} />
                        
                        {/* Row feedback */}
                        {row.feedback && (
                          <div
                            className={`absolute left-0 bottom-1 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold motion-fade-up ${
                              row.feedback.type === "success"
                                ? "text-primary"
                                : "text-error"
                            }`}
                          >
                            {row.feedback.type === "success" ? (
                              <CheckCircle className="w-2.5 h-2.5" />
                            ) : (
                              <AlertTriangle className="w-2.5 h-2.5" />
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
          
          {/* Pagination */}
          <div className="p-6 flex items-center justify-between bg-surface-container-low/30 border-t border-outline-variant/10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'entry' : 'entries'}
            </p>
            {/* Minimal static pagination UI */}
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
