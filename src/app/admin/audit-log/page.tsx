import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AuditLogTable, type AuditLogEntry } from "./AuditLogTable";

const MAX_ENTRIES = 300;

export default async function AdminAuditLogPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, logRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("audit_log")
      .select("id, admin_email, action, entity_type, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_ENTRIES),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  // The audit_log table only exists after migrations/007_add_audit_log.sql has
  // been run against the project — surface that clearly instead of a raw error.
  const tableMissing = logRes.error?.code === "42P01";
  if (logRes.error && !tableMissing) {
    console.error("Failed to load audit log:", logRes.error);
  }

  const entries: AuditLogEntry[] = (logRes.data ?? []).map((row) => ({
    id: row.id,
    admin_email: row.admin_email,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      {tableMissing ? (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-8 text-center animate-[page-enter_300ms_ease-out]">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Audit Log Not Set Up Yet</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Run <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">migrations/007_add_audit_log.sql</code> in
            your Supabase SQL Editor to create the audit trail table, then refresh this page.
          </p>
        </div>
      ) : (
        <AuditLogTable initialEntries={entries} />
      )}
    </div>
  );
}
