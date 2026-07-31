import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { InventoryTable, type AdminProduct } from "./InventoryTable";

export default async function AdminInventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const { data: productsRes, error } = await supabase
    .from("products")
    .select("id, sku, name, stock_sqft, price_per_sqft, category_slug, image")
    .order("sku", { ascending: true });

  if (error) {
    console.error("Failed to load inventory:", error);
  }

  const adminProducts: AdminProduct[] = (productsRes ?? []).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    stock_sqft: Number(row.stock_sqft),
    price_per_sqft: Number(row.price_per_sqft),
    category_slug: row.category_slug,
    image: row.image,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <InventoryTable initialProducts={adminProducts} />
    </div>
  );
}
