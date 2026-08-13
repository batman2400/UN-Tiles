import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Package, ShoppingCart, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { OrdersActivityChart } from "@/components/admin/OrdersActivityChart";

const LOW_STOCK_THRESHOLD = 50;
const ACTIVITY_WINDOW_DAYS = 14;

/** Buckets a flat list of order timestamps into per-day counts for the trailing N days. */
function bucketOrdersByDay(dates: string[], days: number) {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = iso.slice(0, 10); // YYYY-MM-DD
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const buckets = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    buckets.push({
      label: day.toLocaleDateString("en-US", { weekday: "narrow" }),
      fullLabel: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: counts.get(key) ?? 0,
    });
  }
  return buckets;
}

/** Computes the ISO boundaries for "this week" vs "the week before" comparisons. */
function getTrendWindowBoundaries() {
  const now = Date.now();
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    fourteenDaysAgo: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Computes a human-readable week-over-week trend label from two real counts.
 * `higherIsGood` controls whether an increase is styled as positive (emerald)
 * or cautionary (amber) — e.g. more completed orders is good, more active
 * (unfulfilled) orders is not.
 */
function computeTrend(current: number, previous: number, higherIsGood: boolean) {
  if (previous === 0 && current === 0) {
    return { label: "No activity this week", color: "text-gray-500", Icon: Minus };
  }
  if (previous === 0) {
    return { label: "New activity this week", color: "text-emerald-600", Icon: TrendingUp };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) {
    return { label: "Flat vs last week", color: "text-gray-500", Icon: Minus };
  }

  const isIncrease = percent > 0;
  const isGood = isIncrease === higherIsGood;
  return {
    label: `${isIncrease ? "+" : ""}${percent}% vs last week`,
    color: isGood ? "text-emerald-600" : "text-red-500",
    Icon: isIncrease ? TrendingUp : TrendingDown,
  };
}

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

  const { sevenDaysAgo, fourteenDaysAgo } = getTrendWindowBoundaries();
  const activeStatuses = ["Pending", "Processing"];

  // 2. Verify admin role + fetch all metrics as lightweight count-only
  // queries (head: true) instead of downloading every order/product row.
  // This keeps the dashboard fast as the store's data grows.
  const [
    profileRes,
    totalOrdersRes,
    activeOrdersRes,
    completedOrdersRes,
    lowStockRes,
    ordersLast7Res,
    ordersPrev7Res,
    activeLast7Res,
    activePrev7Res,
    completedLast7Res,
    completedPrev7Res,
    activityWindowRes,
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", activeStatuses),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "Delivered"),
    supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_sqft", LOW_STOCK_THRESHOLD),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("date", sevenDaysAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("date", fourteenDaysAgo).lt("date", sevenDaysAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", activeStatuses).gte("date", sevenDaysAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", activeStatuses).gte("date", fourteenDaysAgo).lt("date", sevenDaysAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "Delivered").gte("date", sevenDaysAgo),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "Delivered").gte("date", fourteenDaysAgo).lt("date", sevenDaysAgo),
    // Only the `date` column, bounded to the chart window — never the full orders table.
    supabase.from("orders").select("date").gte("date", fourteenDaysAgo),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const totalOrders = totalOrdersRes.count ?? 0;
  const pendingOrders = activeOrdersRes.count ?? 0;
  const completedOrders = completedOrdersRes.count ?? 0;
  const lowStockProducts = lowStockRes.count ?? 0;

  const totalTrend = computeTrend(ordersLast7Res.count ?? 0, ordersPrev7Res.count ?? 0, true);
  const activeTrend = computeTrend(activeLast7Res.count ?? 0, activePrev7Res.count ?? 0, false);
  const completedTrend = computeTrend(completedLast7Res.count ?? 0, completedPrev7Res.count ?? 0, true);

  const activityBuckets = bucketOrdersByDay(
    (activityWindowRes.data ?? []).map((r) => r.date),
    ACTIVITY_WINDOW_DAYS
  );

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/orders",
      trend: totalTrend.label,
      trendColor: totalTrend.color,
      TrendIcon: totalTrend.Icon,
    },
    {
      title: "Active Orders",
      value: pendingOrders,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/admin/orders",
      trend: activeTrend.label,
      trendColor: activeTrend.color,
      TrendIcon: activeTrend.Icon,
    },
    {
      title: "Low Stock SKUs",
      value: lowStockProducts,
      icon: Package,
      color: lowStockProducts > 0 ? "text-red-600" : "text-green-600",
      bgColor: lowStockProducts > 0 ? "bg-red-50" : "bg-green-50",
      href: "/admin/inventory",
      trend: lowStockProducts > 0 ? "Requires attention" : "Fully stocked",
      trendColor: lowStockProducts > 0 ? "text-amber-600" : "text-emerald-600",
      TrendIcon: lowStockProducts > 0 ? AlertCircle : CheckCircle2,
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/admin/orders",
      trend: completedTrend.label,
      trendColor: completedTrend.color,
      TrendIcon: completedTrend.Icon,
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 sm:mb-8 pl-0 sm:pl-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Welcome back, monitor your store&apos;s performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const TrendIcon = metric.TrendIcon;
          const delayClass = `motion-delay-${(i % 4) + 1}`;
          
          return (
            <Link 
              href={metric.href} 
              key={i} 
              className={`relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 sm:p-6 md:p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all cursor-pointer group min-h-[180px] sm:min-h-[220px] motion-fade-up ${delayClass}`}
            >
              {/* Background Glow */}
              <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors group-hover:opacity-30 ${metric.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`} />
              
              {/* Background Abstract Line Art */}
              <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
                <Icon className="w-48 h-48" />
              </div>

              <div className="relative z-10 flex justify-between items-start gap-2">
                <div className={`p-3 rounded-2xl ${metric.bgColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                
                <div className={`text-[10px] sm:text-xs font-semibold ${metric.trendColor} flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100 text-right leading-tight`}>
                  <TrendIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{metric.trend}</span>
                </div>
              </div>

              <div className="relative z-10 mt-6 sm:mt-8">
                <p className="text-sm font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">{metric.title}</p>
                <p className="text-4xl sm:text-5xl font-mono font-light text-gray-900 mt-2 tracking-tight">{metric.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <OrdersActivityChart data={activityBuckets} />
      </div>
    </div>
  );
}
