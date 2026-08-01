import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex p-4 gap-6">
      <AdminSidebar />
      <div className="flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}
