import { createAdminClient } from "@/utils/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe";

export type RefundOutcome = "Refunded" | "Refund Pending";

/**
 * Issues an idempotent Stripe refund for a paid order and persists the
 * resulting payment_status ("Refunded" or "Refund Pending") via service_role.
 * Never returns "Refunded" if the database update fails.
 */
export async function refundPaidOrder(
  orderId: string,
  paymentDetails: Record<string, unknown> | null | undefined
): Promise<{ paymentStatus: RefundOutcome; dbError?: string }> {
  const existing = paymentDetails ?? {};
  const txnId =
    typeof existing.transaction_id === "string" ? existing.transaction_id : null;
  const admin = createAdminClient();

  if (txnId && txnId.startsWith("pi_")) {
    const stripe = getStripeServerClient();
    if (stripe) {
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: txnId },
          { idempotencyKey: `refund-${orderId}` }
        );
        const nextDetails = {
          ...existing,
          refund_id: refund.id,
          refund_status: refund.status,
          refunded_at: new Date().toISOString(),
        };
        const { error: dbErr } = await admin
          .from("orders")
          .update({ payment_status: "Refunded", payment_details: nextDetails })
          .eq("id", orderId)
          .eq("payment_status", "Paid");

        if (dbErr) {
          console.error(`[refundPaidOrder] Stripe refunded ${orderId}, but DB update failed:`, dbErr);
          return { paymentStatus: "Refund Pending", dbError: dbErr.message };
        }

        return { paymentStatus: "Refunded" };
      } catch (refundErr) {
        console.error(`[refundPaidOrder] Stripe refund failed for ${orderId}:`, refundErr);
      }
    }
  }

  const { error: pendingErr } = await admin
    .from("orders")
    .update({ payment_status: "Refund Pending" })
    .eq("id", orderId)
    .eq("payment_status", "Paid");

  if (pendingErr) {
    console.error(`[refundPaidOrder] Failed to mark Refund Pending for ${orderId}:`, pendingErr);
    return { paymentStatus: "Refund Pending", dbError: pendingErr.message };
  }

  return { paymentStatus: "Refund Pending" };
}
