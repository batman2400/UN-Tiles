import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { InventoryTable, type AdminProduct } from "./InventoryTable";

export default async function AdminInventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("products")
      .select("id, sku, name, stock_sqft, price_per_sqft, category_slug, image")
      .order("sku", { ascending: true }),
    supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const error = productsRes.error;

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  if (error) {
    console.error("Failed to load inventory:", error);
  }

  const adminProducts: AdminProduct[] = (productsRes.data ?? []).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    stock_sqft: Number(row.stock_sqft),
    price_per_sqft: Number(row.price_per_sqft),
    category_slug: row.category_slug,
    image: row.image,
  }));

  const categories = categoriesRes.data ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <InventoryTable
        initialProducts={adminProducts}
        categories={categories}
      />
    </div>
  );
}
