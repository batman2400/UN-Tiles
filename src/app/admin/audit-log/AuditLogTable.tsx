"use client";

import { useState, useMemo } from "react";
import { Search, History, ChevronLeft, ChevronRight, Download, ShoppingCart, Package, Tag } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

export interface AuditLogEntry {
  id: string;
  admin_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 20;

function formatActionLabel(action: string): string {
  return action
    .split(".")
    .join(" ")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getEntityIcon(entityType: string) {
  switch (entityType) {
    case "order": return ShoppingCart;
    case "product": return Package;
    case "category": return Tag;
    default: return History;
  }
}

function getEntityBadgeColor(entityType: string) {
  switch (entityType) {
    case "order": return "bg-blue-50 text-blue-700 border-blue-200/60";
    case "product": return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    case "category": return "bg-purple-50 text-purple-700 border-purple-200/60";
    default: return "bg-gray-50 text-gray-700 border-gray-200/60";
  }
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return "—";

  if (typeof details.from !== "undefined" && typeof details.to !== "undefined") {
    return `${String(details.from)} → ${String(details.to)}`;
  }
  if (typeof details.count === "number") {
    const rest = typeof details.to !== "undefined" ? `to "${details.to}"` : typeof details.amount === "number" ? `${details.amount > 0 ? "+" : ""}${details.amount} sq ft` : "";
    return `${details.count} item${details.count === 1 ? "" : "s"}${rest ? ` — ${rest}` : ""}`;
  }
  if (typeof details.name === "string") {
    return details.name;
  }
  if (typeof details.sku === "string") {
    return `SKU ${details.sku}`;
  }

  const entries = Object.entries(details).slice(0, 3);
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ") || "—";
}

export function AuditLogTable({ initialEntries }: { initialEntries: AuditLogEntry[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const availableActions = useMemo(
    () => Array.from(new Set(initialEntries.map((e) => e.action))).sort(),
    [initialEntries]
  );

  const filteredEntries = useMemo(() => {
    return initialEntries.filter((e) => {
      if (actionFilter !== "All" && e.action !== actionFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (e.admin_email || "").toLowerCase().includes(q) ||
        e.entity_id.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      );
    });
  }, [initialEntries, searchQuery, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, currentPage]);

  const handleExportCsv = () => {
    downloadCsv(
      `audit-log-export-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Timestamp", "Admin", "Action", "Entity Type", "Entity ID", "Details"],
      filteredEntries.map((e) => [
        new Date(e.created_at).toLocaleString(),
        e.admin_email || "",
        formatActionLabel(e.action),
        e.entity_type,
        e.entity_id,
        formatDetails(e.details),
      ])
    );
  };

  return (
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">A record of every admin action across the store.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <select
            className="bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 py-2.5 px-3 transition-all cursor-pointer w-full md:w-auto"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Actions</option>
            {availableActions.map((a) => (
              <option key={a} value={a}>{formatActionLabel(a)}</option>
            ))}
          </select>
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin, entity ID..."
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
            title="Export currently filtered log entries to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors w-full md:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[16%] text-left">Timestamp</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[20%] text-left">Admin</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[18%] text-left">Action</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[14%] text-left">Entity</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[32%] text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <History className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No audit log entries yet — admin actions will start appearing here.
                </td>
              </tr>
            )}
            {paginatedEntries.map((entry, index) => {
              const delayClass = `motion-delay-${(index % 4) + 1}`;
              const EntityIcon = getEntityIcon(entry.entity_type);

              return (
                <tr key={entry.id} className={`group bg-white border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-accent hover:bg-gray-50/80 transition-all motion-fade-up ${delayClass}`}>
                  <td className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500">
                      {new Date(entry.created_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="text-sm font-semibold text-gray-900">{entry.admin_email || "Unknown"}</span>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getEntityBadgeColor(entry.entity_type)}`}>
                      {formatActionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                      <EntityIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[120px]" title={entry.entity_id}>{entry.entity_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="text-[13px] text-gray-600">{formatDetails(entry.details)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Showing {paginatedEntries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, filteredEntries.length)} of {filteredEntries.length}{" "}
          {filteredEntries.length === 1 ? "entry" : "entries"}
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
    </div>
  );
}
