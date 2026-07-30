import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminStockEditor } from "./AdminStockEditor";
import { AdminOrdersPanel } from "./AdminOrdersPanel";

// ── Types ──────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  stock_sqft: number;
  price_per_sqft: number;
  category_slug: string;
}

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

// ── Server Component ───────────────────────────────────

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify admin role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/login");
  }

  // 3. Fetch data in parallel
  const [productsRes, ordersRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, name, stock_sqft, price_per_sqft, category_slug")
      .order("sku", { ascending: true }),
    supabase
      .from("orders")
      .select(`
        id, status, items, total, delivery_method, date,
        profiles (
          first_name, last_name, email, phone
        )
      `)
      .order("date", { ascending: false })
  ]);

  if (productsRes.error) {
    console.error("Failed to load products for admin:", productsRes.error);
  }
  if (ordersRes.error) {
    console.error("Failed to load orders for admin:", ordersRes.error);
  }

  const adminProducts: AdminProduct[] = (productsRes.data ?? []).map((row) => ({
    id: row.id as string,
    sku: row.sku as string,
    name: row.name as string,
    stock_sqft: Number(row.stock_sqft),
    price_per_sqft: Number(row.price_per_sqft),
    category_slug: row.category_slug as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminOrders: AdminOrder[] = (ordersRes.data ?? []).map((row: any) => ({
    id: row.id,
    status: row.status,
    items: row.items,
    total: row.total,
    delivery_method: row.delivery_method,
    date: row.date,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  }));

  const pendingOrders = adminOrders.filter(o => o.status === 'Pending').length;
  const completedOrders = adminOrders.filter(o => o.status === 'Delivered').length;

  return (
    <section className="min-h-[calc(100vh-6rem)] bg-surface py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 motion-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">
            Administration
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">
            Control Panel
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">
            Monitor stock levels, restock products, and manage customer orders.
          </p>
        </div>

        {/* Inventory Table (client component for editing) */}
        <div className="motion-fade-up motion-delay-2 space-y-12">
          <AdminStockEditor initialProducts={adminProducts} />
          
          <AdminOrdersPanel 
            initialOrders={adminOrders} 
            lowStockCount={adminProducts.filter((p) => p.stock_sqft < 100).length} 
          />
        </div>
      </div>
    </section>
  );
}
