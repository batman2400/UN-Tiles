import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  adminId: string;
  adminEmail: string | null | undefined;
  action: string;
  entityType: "order" | "product" | "category";
  entityId: string;
  details?: Record<string, unknown>;
}

/**
 * Best-effort audit trail write. Never throws — a failed log write should
 * never block the actual admin action (stock update, status change, etc.)
 * that already succeeded.
 */
export async function logAdminAction(supabase: SupabaseClient, entry: AuditLogEntry) {
  const { error } = await supabase.from("audit_log").insert({
    admin_id: entry.adminId,
    admin_email: entry.adminEmail ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    details: entry.details ?? null,
  });

  if (error) {
    console.error("Failed to write audit log entry:", error.message);
  }
}
