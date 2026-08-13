"use client";

import { useState, useMemo } from "react";
import { Search, Users, ChevronLeft, ChevronRight, Download, Mail, Phone, ShieldCheck } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

export interface AdminCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  orderCount: number;
}

const PAGE_SIZE = 10;

export function CustomersTable({ initialCustomers }: { initialCustomers: AdminCustomer[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return initialCustomers;
    const q = searchQuery.toLowerCase();
    return initialCustomers.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      return (
        name.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
      );
    });
  }, [initialCustomers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const handleExportCsv = () => {
    downloadCsv(
      `customers-export-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Email", "Phone", "Role", "Joined", "Total Orders"],
      filteredCustomers.map((c) => [
        `${c.first_name} ${c.last_name}`.trim(),
        c.email,
        c.phone,
        c.role,
        new Date(c.created_at).toLocaleDateString(),
        c.orderCount,
      ])
    );
  };

  return (
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500 mt-1">
            {initialCustomers.length} registered {initialCustomers.length === 1 ? "customer" : "customers"}.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
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
            title="Export currently filtered customers to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[28%] text-left">Customer</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[25%] text-left">Contact</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left">Role</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[17%] text-left">Joined</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right">Orders</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No customers found.
                </td>
              </tr>
            )}
            {paginatedCustomers.map((customer, index) => {
              const delayClass = `motion-delay-${(index % 4) + 1}`;
              const initials = `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`.toUpperCase() || "?";

              return (
                <tr key={customer.id} className={`group bg-white border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-accent hover:bg-gray-50/80 transition-all motion-fade-up ${delayClass}`}>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <span className="font-semibold text-sm text-gray-900 group-hover:text-accent transition-colors">
                        {customer.first_name} {customer.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      {customer.email && (
                        <span className="text-xs text-gray-600 flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" />{customer.email}</span>
                      )}
                      {customer.phone && (
                        <span className="text-xs text-gray-600 flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" />{customer.phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    {customer.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="text-xs text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-gray-900">{customer.orderCount}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Showing {paginatedCustomers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length}{" "}
          {filteredCustomers.length === 1 ? "customer" : "customers"}
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
