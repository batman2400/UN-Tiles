import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gray-50 flex p-4 gap-6 overflow-hidden">
      {/* Liquid Glass Animated Background */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent-soft rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-accent-soft rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Layout Content */}
      <div className="relative z-10 flex w-full gap-6">
        <AdminSidebar />
        <div className="flex-1 min-h-screen relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
