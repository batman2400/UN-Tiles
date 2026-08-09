import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CustomersTable, type AdminCustomer } from "./CustomersTable";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, profilesRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role, created_at")
      .order("created_at", { ascending: false }),
    // Only the `user_id` column — used purely to derive a per-customer order count.
    supabase.from("orders").select("user_id"),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  if (profilesRes.error) {
    console.error("Failed to load customers for admin:", profilesRes.error);
  }

  const orderCounts = new Map<string, number>();
  for (const row of ordersRes.data ?? []) {
    orderCounts.set(row.user_id, (orderCounts.get(row.user_id) ?? 0) + 1);
  }

  const customers: AdminCustomer[] = (profilesRes.data ?? []).map((row) => ({
    id: row.id,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role ?? "user",
    created_at: row.created_at,
    orderCount: orderCounts.get(row.id) ?? 0,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <CustomersTable initialCustomers={customers} />
    </div>
  );
}
