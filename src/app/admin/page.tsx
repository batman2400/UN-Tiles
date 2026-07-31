import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Package, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/login");
  }

  // 3. Fetch data for metrics
  const [productsRes, ordersRes] = await Promise.all([
    supabase.from("products").select("stock_sqft"),
    supabase.from("orders").select("status")
  ]);

  const products = productsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const lowStockProducts = products.filter(p => Number(p.stock_sqft) < 100).length;

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Low Stock SKUs",
      value: lowStockProducts,
      icon: Package,
      color: lowStockProducts > 0 ? "text-red-600" : "text-green-600",
      bgColor: lowStockProducts > 0 ? "bg-red-100" : "bg-green-100"
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-[page-enter_300ms_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Welcome back, monitor your store's performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
              <div className={`p-4 rounded-full ${metric.bgColor}`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
