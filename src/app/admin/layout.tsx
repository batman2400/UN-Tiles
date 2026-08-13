import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NewOrderNotifier } from "@/components/admin/NewOrderNotifier";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row p-3 sm:p-4 gap-4 lg:gap-6 overflow-x-clip">
      <AdminSidebar />
      <div className="flex-1 min-w-0 min-h-0 lg:min-h-screen">
        {children}
      </div>
      <NewOrderNotifier />
      <CommandPalette />
    </div>
  );
}
