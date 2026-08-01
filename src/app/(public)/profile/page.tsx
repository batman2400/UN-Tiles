"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  CheckCircle, 
  Camera, 
  FileText, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

type SidebarSection = "account" | "orders" | "addresses";
type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

interface OrderRecord {
  id: string;
  status: string;
  items: string;
  date: string;
  total: string;
  delivery_method: string | null;
}

interface AddressRecord {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  country: string;
  is_default?: boolean;
}

const sidebarLinks: { key: SidebarSection; label: string; icon: typeof User }[] = [
  { key: "account", label: "Account Details", icon: User },
  { key: "orders", label: "Order History", icon: Package },
  { key: "addresses", label: "Saved Addresses", icon: MapPin },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseAndFormatTotal(totalStr: string): string {
  const numMatches = totalStr.match(/[\d.]+/g);
  if (!numMatches) return totalStr;
  
  const parsed = parseFloat(numMatches.join(''));
  if (isNaN(parsed)) return totalStr;
  
  return formatCurrency(parsed);
}

function getStatusBadgeStyle(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
    case "shipped":
      return "bg-purple-50 text-purple-700 border border-purple-200/60";
    case "processing":
      return "bg-blue-50 text-blue-700 border border-blue-200/60";
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-200/60";
    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-200/60";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200/60";
  }
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, logout, updateProfile } = useAuth();
  
  const tabParam = searchParams.get("tab") as SidebarSection | null;
  const initialTab = tabParam && ["account", "orders", "addresses"].includes(tabParam) 
    ? tabParam 
    : "account";
    
  const [activeSection, setActiveSection] = useState<SidebarSection>(initialTab);
  
  const [prevTab, setPrevTab] = useState(initialTab);
  if (initialTab !== prevTab) {
    setPrevTab(initialTab);
    setActiveSection(initialTab);
  }
  
  const [profileEdits, setProfileEdits] = useState<Partial<ProfileFormState>>({});
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserData = async () => {
      const [ordersRes, addressesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, status, items, date, total, delivery_method")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("addresses")
          .select("id, label, line1, line2, country")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data as OrderRecord[]);
      }
      if (addressesRes.data) {
        setAddresses(addressesRes.data as AddressRecord[]);
      }
    };

    void fetchUserData();
  }, [supabase, user?.id]);

  const formValues: ProfileFormState = {
    firstName: profileEdits.firstName ?? user?.firstName ?? "",
    lastName: profileEdits.lastName ?? user?.lastName ?? "",
    email: profileEdits.email ?? user?.email ?? "",
    phone: profileEdits.phone ?? user?.phone ?? "",
  };

  const updateFormField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) => {
    setProfileEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);

    const result = await updateProfile(formValues);
    setIsUpdating(false);
    
    if (result.success) {
      setProfileEdits({});
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <section className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-gray-50/50 to-gray-100/50 pt-32 pb-16 md:pt-40 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-gray-100 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">Loading Studio Portal...</p>
        </div>
      </section>
    );
  }

  if (!user) return null;

  const initialF = user.firstName
    ? user.firstName[0].toUpperCase()
    : (user.email.charAt(0) || "U").toUpperCase();
  const initialL = user.lastName ? user.lastName[0].toUpperCase() : "";
  const initials = `${initialF}${initialL}`;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : "Studio Member";

  return (
    <section className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-gray-50/60 via-gray-50 to-gray-100/40 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Portal Header */}
        <div className="mb-8 motion-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                Studio Account Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-zinc-900 mt-2 tracking-tight">
                Welcome back, {user.firstName || "Member"}
              </h1>
            </div>
          </div>
        </div>

        {/* Mobile Header / Navigation */}
        <div className="md:hidden mb-6 motion-fade-up">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              {/* User Avatar with Gold Ring */}
              <div className="relative group">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 rounded-full shadow-md">
                  <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-display font-bold text-yellow-400 tracking-wider">{initials}</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-zinc-950 p-1.5 rounded-full shadow-sm">
                  <Camera className="w-3 h-3" />
                </div>
              </div>
              <div>
                <h2 className="font-display font-bold text-zinc-900 text-base">{displayName}</h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {sidebarLinks.map(({ key, label, icon: Icon }) => {
                const isActive = activeSection === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => setActiveSection(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all ${
                      isActive 
                        ? "bg-yellow-500/15 text-yellow-700 border border-yellow-500/30 shadow-sm" 
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl whitespace-nowrap text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden md:block w-72 flex-shrink-0 motion-fade-up">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-28">
              
              {/* User Profile Card Header */}
              <div className="p-8 text-center border-b border-gray-100/80 bg-gradient-to-b from-gray-50/50 to-transparent">
                <div className="relative inline-block mb-4 group cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 rounded-full shadow-md group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-display font-bold text-yellow-400 tracking-wider">{initials}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-yellow-500 text-zinc-950 p-1.5 rounded-full shadow-md border-2 border-white hover:bg-yellow-400 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h2 className="font-display font-bold text-zinc-900 text-lg">{displayName}</h2>
                <p className="text-xs text-gray-500 mt-1 truncate px-2">{user.email}</p>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1.5">
                {sidebarLinks.map(({ key, label, icon: Icon }) => {
                  const isActive = activeSection === key;
                  return (
                    <button 
                      key={key} 
                      onClick={() => setActiveSection(key)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all ${
                        isActive
                          ? "bg-yellow-500/10 text-yellow-600 border-r-4 border-yellow-500 font-semibold shadow-sm"
                          : "text-gray-600 hover:text-zinc-900 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-yellow-600" : "text-gray-400"}`} />
                        <span>{label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "text-yellow-600 translate-x-0.5" : "text-gray-300 opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </nav>

              {/* Log Out Action */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/40">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 motion-fade-up motion-delay-1">
            
            {/* 1. ACCOUNT DETAILS TAB */}
            {activeSection === "account" && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="mb-8 pb-6 border-b border-gray-100">
                  <h2 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">Account Details</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage your personal studio profile information.</p>
                </div>

                {updateSuccess && (
                  <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 motion-fade-up shadow-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Profile updated successfully.</p>
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* First Name Input Card */}
                    <div className="space-y-2">
                      <label htmlFor="profile-first-name" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                        First Name
                      </label>
                      <input 
                        id="profile-first-name" 
                        type="text" 
                        value={formValues.firstName} 
                        onChange={(e) => updateFormField("firstName", e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 outline-none focus:bg-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-medium placeholder:text-gray-400" 
                        placeholder="John"
                      />
                    </div>

                    {/* Last Name Input Card */}
                    <div className="space-y-2">
                      <label htmlFor="profile-last-name" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                        Last Name
                      </label>
                      <input 
                        id="profile-last-name" 
                        type="text" 
                        value={formValues.lastName} 
                        onChange={(e) => updateFormField("lastName", e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 outline-none focus:bg-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-medium placeholder:text-gray-400" 
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email Address Input Card */}
                  <div className="space-y-2">
                    <label htmlFor="profile-email" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Email Address
                    </label>
                    <input 
                      id="profile-email" 
                      type="email" 
                      value={formValues.email} 
                      onChange={(e) => updateFormField("email", e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 outline-none focus:bg-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-medium placeholder:text-gray-400" 
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  {/* Phone Number Input Card */}
                  <div className="space-y-2">
                    <label htmlFor="profile-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Phone Number
                    </label>
                    <input 
                      id="profile-phone" 
                      type="tel" 
                      value={formValues.phone} 
                      onChange={(e) => updateFormField("phone", e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 outline-none focus:bg-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-medium placeholder:text-gray-400" 
                      placeholder="+94 77 123 4567"
                    />
                  </div>

                  {/* Primary Dark/Gold Gradient Action Button */}
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isUpdating}
                      className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3.5 px-8 shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span className="text-xs uppercase tracking-widest">{isUpdating ? "Updating Profile..." : "Update Profile"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. ORDER HISTORY TAB */}
            {activeSection === "orders" && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="mb-8 pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">Order History</h2>
                    <p className="text-xs text-gray-500 mt-1">Review your luxury tile orders and fulfillment status.</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                    {orders.length} Total {orders.length === 1 ? "Order" : "Orders"}
                  </span>
                </div>

                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-display font-bold text-zinc-900 text-base mb-1">No Orders Placed Yet</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                        Explore our luxury architectural tile collection to elevate your spaces.
                      </p>
                      <button 
                        onClick={() => router.push("/collections")}
                        className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3 px-6 text-xs uppercase tracking-widest shadow-md transition-all"
                      >
                        Explore Collections
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const badgeStyle = getStatusBadgeStyle(order.status);
                      
                      return (
                        <div 
                          key={order.id} 
                          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                        >
                          {/* Card Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-base font-bold text-zinc-900 group-hover:text-yellow-600 transition-colors">
                                  #{order.id.startsWith("UN-") ? order.id.toUpperCase() : `UN-2026-${order.id.substring(0, 8).toUpperCase()}`}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeStyle}`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                {order.delivery_method && (
                                  <>
                                    <span>•</span>
                                    <span className="uppercase">{order.delivery_method}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Total Amount</span>
                              <span className="font-mono text-lg font-bold text-zinc-900">{parseAndFormatTotal(order.total)}</span>
                            </div>
                          </div>

                          {/* Items Preview Row */}
                          <div className="py-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-yellow-500/20 text-yellow-600">
                              <Package className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 truncate" title={order.items}>
                                {order.items}
                              </p>
                              <p className="text-xs text-gray-400">Architectural Tile Item Specification</p>
                            </div>
                          </div>

                          {/* Action Items Footer */}
                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              <span>Invoice Generated</span>
                            </div>
                            
                            <button className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-yellow-600 transition-colors">
                              <span>View Order Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. SAVED ADDRESSES TAB */}
            {activeSection === "addresses" && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
                <div className="mb-8 pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">Saved Addresses</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage delivery locations for faster studio checkout.</p>
                  </div>
                  <button className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3 px-5 text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>
                
                {addresses.length === 0 ? (
                  /* Minimalist Empty State */
                  <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-zinc-900 text-base mb-1">No Saved Addresses Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                      Add your studio or job site addresses to speed up tile delivery checkout.
                    </p>
                    <button className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3 px-6 text-xs uppercase tracking-widest shadow-md transition-all inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  /* Address Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {addresses.map((addr, idx) => (
                      <div key={addr.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative flex flex-col justify-between group">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-yellow-500" />
                              {addr.label}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-500/15 text-yellow-700 px-2.5 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                Default
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 mb-6">
                            <p className="font-medium text-zinc-900">{addr.line1}</p>
                            {addr.line2 && <p>{addr.line2}</p>}
                            <p className="text-xs text-gray-400 mt-2 font-mono uppercase">{addr.country}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Dashed Add New Address Card Trigger */}
                    <button className="bg-gray-50/50 hover:bg-white border-2 border-dashed border-gray-200 hover:border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all min-h-[180px]">
                      <div className="w-10 h-10 bg-white group-hover:bg-yellow-500 group-hover:text-black text-gray-400 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all mb-3">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-600 group-hover:text-zinc-900 transition-colors">
                        + Add New Address
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-gray-50/50 to-gray-100/50 flex items-center justify-center pt-32 pb-16 px-6">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">Loading Studio Portal...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
