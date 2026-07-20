import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminStockEditor } from "./AdminStockEditor";

// ── Types ──────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  stock_sqft: number;
  price_per_sqft: number;
  category_slug: string;
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

  // 3. Fetch all products for inventory management
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, sku, name, stock_sqft, price_per_sqft, category_slug")
    .order("sku", { ascending: true });

  if (productsError) {
    console.error("Failed to load products for admin:", productsError);
  }

  const adminProducts: AdminProduct[] = (products ?? []).map((row) => ({
    id: row.id as string,
    sku: row.sku as string,
    name: row.name as string,
    stock_sqft: Number(row.stock_sqft),
    price_per_sqft: Number(row.price_per_sqft),
    category_slug: row.category_slug as string,
  }));

  return (
    <section className="min-h-[calc(100vh-6rem)] bg-surface py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 motion-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">
            Administration
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">
            Inventory Management
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">
            Monitor stock levels and restock products. Changes are saved directly
            to the live database.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 motion-fade-up motion-delay-1">
          <div className="bg-surface-container-lowest premium-shadow p-5">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Total SKUs</p>
            <p className="text-2xl font-display font-bold text-on-surface">{adminProducts.length}</p>
          </div>
          <div className="bg-surface-container-lowest premium-shadow p-5">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Total Stock</p>
            <p className="text-2xl font-display font-bold text-on-surface">
              {adminProducts.reduce((sum, p) => sum + p.stock_sqft, 0).toLocaleString()} sq ft
            </p>
          </div>
          <div className="bg-surface-container-lowest premium-shadow p-5">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Low Stock</p>
            <p className="text-2xl font-display font-bold text-[#9f403d]">
              {adminProducts.filter((p) => p.stock_sqft < 100).length}
            </p>
          </div>
          <div className="bg-surface-container-lowest premium-shadow p-5">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Categories</p>
            <p className="text-2xl font-display font-bold text-on-surface">
              {new Set(adminProducts.map((p) => p.category_slug)).size}
            </p>
          </div>
        </div>

        {/* Inventory Table (client component for editing) */}
        <div className="motion-fade-up motion-delay-2">
          <AdminStockEditor initialProducts={adminProducts} />
        </div>
      </div>
    </section>
  );
}
