"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Package, MapPin, LogOut, CheckCircle } from "lucide-react";
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
  // Extract only numbers and decimals from the string
  const numMatches = totalStr.match(/[\d.]+/g);
  if (!numMatches) return totalStr;
  
  const parsed = parseFloat(numMatches.join(''));
  if (isNaN(parsed)) return totalStr;
  
  return formatCurrency(parsed);
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, logout, updateProfile } = useAuth();
  
  // Parse tab from search params or default to "account"
  const tabParam = searchParams.get("tab") as SidebarSection | null;
  const initialTab = tabParam && ["account", "orders", "addresses"].includes(tabParam) 
    ? tabParam 
    : "account";
    
  const [activeSection, setActiveSection] = useState<SidebarSection>(initialTab);
  
  // If the URL changes (e.g. user goes back/forward), sync the state
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

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);


  // Fetch related data once a user is known.
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
      <section className="min-h-[calc(100vh-6rem)] bg-surface py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest p-10 md:p-14 ambient-glow text-center">
            <p className="text-sm uppercase tracking-widest text-on-surface-variant">Loading profile...</p>
          </div>
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
  const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : "My Profile";

  return (
    <section className="min-h-[calc(100vh-6rem)] bg-surface py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 motion-fade-up">
          <div className="bg-surface-container-lowest p-6 ambient-glow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
                <span className="text-lg font-display font-semibold text-on-surface">{initials}</span>
              </div>
              <div>
                <h2 className="font-display font-semibold text-on-surface">{displayName}</h2>
                <p className="text-sm text-on-surface-variant">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {sidebarLinks.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveSection(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-colors ${
                    activeSection === key ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap text-[#9f403d] bg-[#9f403d]/6 hover:bg-[#9f403d]/12 transition-colors">
                <LogOut className="w-3.5 h-3.5" />Log Out
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 motion-fade-up">
            <div className="bg-surface-container-lowest p-8 ambient-glow sticky top-28">
              <div className="flex flex-col items-center mb-10">
                <div className="w-20 h-20 bg-surface-container-high flex items-center justify-center mb-4">
                  <span className="text-2xl font-display font-semibold text-on-surface">{initials}</span>
                </div>
                <h2 className="font-display font-semibold text-on-surface text-lg">{displayName}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{user.email}</p>
              </div>
              <nav className="space-y-2">
                {sidebarLinks.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setActiveSection(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium tracking-wide transition-all ${
                      activeSection === key
                        ? "border-l-2 border-primary text-primary bg-surface-container-low"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-l-2 border-transparent"
                    }`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </nav>
              <div className="mt-10 pt-8">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium tracking-wide text-[#9f403d] hover:bg-[#9f403d]/6 transition-colors">
                  <LogOut className="w-4 h-4" />Log Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 motion-fade-up motion-delay-1">
            {activeSection === "account" && (
              <div className="bg-surface-container-lowest p-8 md:p-12 ambient-glow">
                <h2 className="text-2xl font-display font-semibold tracking-tight text-on-surface mb-10">Account Details</h2>

                {updateSuccess && (
                  <div className="mb-8 bg-primary/5 border-l-2 border-primary px-5 py-4 motion-fade-up">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-sm text-on-surface">Profile updated successfully.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-8 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label htmlFor="profile-first-name" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">First Name</label>
                      <input id="profile-first-name" type="text" value={formValues.firstName} onChange={(e) => updateFormField("firstName", e.target.value)}
                        className="w-full bg-transparent border-b border-outline py-3 text-on-surface outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="profile-last-name" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Last Name</label>
                      <input id="profile-last-name" type="text" value={formValues.lastName} onChange={(e) => updateFormField("lastName", e.target.value)}
                        className="w-full bg-transparent border-b border-outline py-3 text-on-surface outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-email" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Email Address</label>
                    <input id="profile-email" type="email" value={formValues.email} onChange={(e) => updateFormField("email", e.target.value)}
                      className="w-full bg-transparent border-b border-outline py-3 text-on-surface outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-phone" className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Phone Number</label>
                    <input id="profile-phone" type="tel" value={formValues.phone} onChange={(e) => updateFormField("phone", e.target.value)}
                      className="w-full bg-transparent border-b border-outline py-3 text-on-surface outline-none form-field-animate focus:border-b-2 focus:border-primary focus:bg-surface-container-highest/40 transition-colors" />
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={isUpdating}
                      className="kinetic-button bg-primary hover:bg-primary-dim text-on-primary px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                      <span>{isUpdating ? "Updating..." : "Update Profile"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "orders" && (
              <div className="bg-surface-container-lowest p-8 md:p-12 ambient-glow">
                <h2 className="text-2xl font-display font-semibold tracking-tight text-on-surface mb-10">Order History</h2>
                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="bg-surface-container-low p-8 text-center text-on-surface-variant transition-colors hover:bg-surface-container">
                      <Package className="w-10 h-10 mx-auto mb-4 opacity-50" />
                      <p>You haven&apos;t placed any orders yet.</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="bg-surface-container-low p-6 transition-colors hover:bg-surface-container">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <span className="font-display font-semibold text-on-surface">{order.id}</span>
                          <div className="flex items-center gap-2">
                            {order.delivery_method && (
                              <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 bg-accent-soft text-accent">
                                {order.delivery_method}
                              </span>
                            )}
                            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1.5 ${
                              order.status === "Delivered" ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant"
                            }`}>{order.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-1">{order.items}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-outline">{new Date(order.date).toLocaleDateString()}</span>
                          <span className="font-semibold text-on-surface">{parseAndFormatTotal(order.total)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="bg-surface-container-lowest p-8 md:p-12 ambient-glow">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-display font-semibold tracking-tight text-on-surface">Saved Addresses</h2>
                  <button className="kinetic-button bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors">
                    <span>Add New</span>
                  </button>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="bg-surface-container-low p-8 text-center text-on-surface-variant transition-colors hover:bg-surface-container">
                    <MapPin className="w-10 h-10 mx-auto mb-4 opacity-50" />
                    <p>No addresses saved. Add one to speed up checkout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="bg-surface-container-low p-6 transition-colors hover:bg-surface-container">
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">{addr.label}</span>
                        <p className="text-sm text-on-surface mb-1">{addr.line1}</p>
                        <p className="text-sm text-on-surface-variant mb-1">{addr.line2}</p>
                        <p className="text-sm text-outline">{addr.country}</p>
                      </div>
                    ))}
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
    <Suspense fallback={<div className="min-h-[calc(100vh-6rem)] bg-surface flex items-center justify-center">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
