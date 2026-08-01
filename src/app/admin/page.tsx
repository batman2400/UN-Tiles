import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Package, ShoppingCart, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

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
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const lowStockProducts = products.filter(p => Number(p.stock_sqft) <= 50).length;

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/orders",
      trend: "+12% this month",
      trendColor: "text-emerald-600"
    },
    {
      title: "Active Orders",
      value: pendingOrders,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/admin/orders",
      trend: "-2% this month",
      trendColor: "text-red-500"
    },
    {
      title: "Low Stock SKUs",
      value: lowStockProducts,
      icon: Package,
      color: lowStockProducts > 0 ? "text-red-600" : "text-green-600",
      bgColor: lowStockProducts > 0 ? "bg-red-50" : "bg-green-50",
      href: "/admin/inventory",
      trend: "Requires attention",
      trendColor: "text-amber-600"
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/admin/orders",
      trend: "+8% this month",
      trendColor: "text-emerald-600"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-[page-enter_300ms_ease-out]">
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Welcome back, monitor your store's performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          // First item spans 2 columns on desktop
          const spanClass = i === 0 ? "md:col-span-2" : "md:col-span-1";
          
          return (
            <Link 
              href={metric.href} 
              key={i} 
              className={`relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:bg-white/80 transition-all duration-500 cursor-pointer group min-h-[220px] ${spanClass}`}
            >
              {/* Background Glow */}
              <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors group-hover:opacity-30 ${metric.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`} />
              
              {/* Background Abstract Line Art */}
              <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
                <Icon className="w-48 h-48" />
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${metric.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                
                <div className={`text-xs font-semibold ${metric.trendColor} flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-100`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  {metric.trend}
                </div>
              </div>

              <div className="relative z-10 mt-8">
                <p className="text-sm font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">{metric.title}</p>
                <p className="text-5xl font-mono font-light text-gray-900 mt-2 tracking-tight">{metric.value}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
