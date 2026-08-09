import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrdersTable, type AdminOrder } from "./OrdersTable";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select(`
        id, status, items, total, delivery_method, date,
        profiles (
          first_name, last_name, email, phone
        )
      `)
      .order("date", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const error = ordersRes.error;

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  if (error) {
    console.error("Failed to load orders for admin:", error);
  }

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

  return (
    <div className="max-w-6xl mx-auto">
      <OrdersTable initialOrders={adminOrders} adminId={user.id} adminEmail={user.email ?? null} />
    </div>
  );
}
