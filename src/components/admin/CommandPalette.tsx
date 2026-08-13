"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Search, CornerDownLeft, History } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

/**
 * Cmd/Ctrl+K command palette for fast admin navigation — avoids hunting
 * through the sidebar when jumping between Dashboard / Inventory / Orders /
 * Customers, and doubles as a keyboard-first sign-out shortcut.
 */
export function CommandPalette() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  const commands: Command[] = useMemo(
    () => [
      { id: "dashboard", label: "Go to Dashboard", hint: "Overview & metrics", icon: LayoutDashboard, action: () => router.push("/admin") },
      { id: "inventory", label: "Go to Inventory", hint: "Manage products & stock", icon: Package, action: () => router.push("/admin/inventory") },
      { id: "orders", label: "Go to Orders", hint: "Fulfillment & status", icon: ShoppingCart, action: () => router.push("/admin/orders") },
      { id: "customers", label: "Go to Customers", hint: "Registered accounts", icon: Users, action: () => router.push("/admin/customers") },
      { id: "audit-log", label: "Go to Audit Log", hint: "Admin action history", icon: History, action: () => router.push("/admin/audit-log") },
      { id: "signout", label: "Sign Out", hint: "End admin session", icon: LogOut, action: handleSignOut },
    ],
    [router, handleSignOut]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
  }, [commands, query]);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
        } else {
          openPalette();
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("admin:open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("admin:open-command-palette", openPalette);
    };
  }, [isOpen, openPalette]);

  const runCommand = (cmd: Command) => {
    setIsOpen(false);
    setQuery("");
    cmd.action();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      runCommand(filtered[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed left-1/2 top-[12%] sm:top-[20%] -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-lg bg-white rounded-2xl shadow-2xl z-[301] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Jump to a page or run a command..."
            className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-gray-100 rounded border border-gray-200">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-gray-400">No matching commands.</p>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            const isActive = i === activeIndex;
            return (
              <button
                key={cmd.id}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  isActive ? "bg-accent/10 text-accent" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm font-semibold">{cmd.label}</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{cmd.hint}</span>
                {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
