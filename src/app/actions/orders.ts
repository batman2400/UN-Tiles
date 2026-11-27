"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CATALOG_CACHE_TAG } from "@/data/products";
import { getStripeServerClient } from "@/lib/stripe";

const cancelOrderSchema = z.object({
  orderId: z.string().trim().min(1, "Order ID is required"),
  reason: z.string().trim().max(500, "Reason must be under 500 characters").optional(),
});

export interface CancelOrderResult {
  success: boolean;
  orderId?: string;
  paymentStatus?: string;
  statusDescription?: string;
  statusHistory?: Array<{
    status: string;
    description?: string | null;
    timestamp: string;
    updated_by?: string | null;
  }>;
  statusUpdatedAt?: string;
  error?: string;
}

async function refundPaidStripeOrder(
  orderId: string,
  paymentDetails: Record<string, unknown> | null | undefined
): Promise<"Refunded" | "Refund Pending"> {
  const txnId =
    paymentDetails && typeof paymentDetails.transaction_id === "string"
      ? paymentDetails.transaction_id
      : null;

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
          ...(paymentDetails ?? {}),
          refund_id: refund.id,
          refund_status: refund.status,
          refunded_at: new Date().toISOString(),
        };
        await admin
          .from("orders")
          .update({ payment_status: "Refunded", payment_details: nextDetails })
          .eq("id", orderId);
        return "Refunded";
      } catch (refundErr) {
        console.error(`[orders] Stripe refund failed for ${orderId}:`, refundErr);
      }
    }
  }

  await admin
    .from("orders")
    .update({ payment_status: "Refund Pending" })
    .eq("id", orderId);
  return "Refund Pending";
}

export async function cancelCustomerOrder(rawInput: {
  orderId: string;
  reason?: string;
}): Promise<CancelOrderResult> {
  const parsed = cancelOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { orderId, reason } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be logged in to cancel an order.",
    };
  }

  // Inspect current payment state before cancellation so paid Stripe orders trigger a refund
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("payment_status, payment_details")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data, error } = await supabase.rpc("cancel_customer_order", {
    p_order_id: orderId,
    p_reason: reason || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to cancel order.",
    };
  }

  let nextPaymentStatus: string | undefined;
  if (existingOrder?.payment_status === "Paid") {
    try {
      nextPaymentStatus = await refundPaidStripeOrder(
        orderId,
        existingOrder.payment_details as Record<string, unknown> | null
      );
    } catch (refundErr) {
      console.error("[orders] Failed to record refund status:", refundErr);
      nextPaymentStatus = "Refund Pending";
    }
  }

  // Immediately expire cached catalog inventory and revalidate storefront + admin views
  try {
    updateTag(CATALOG_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/collections");
    revalidatePath("/collections/[id]", "page");
    revalidatePath("/planner");
    revalidatePath("/profile");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
  } catch (err) {
    console.error("Failed to revalidate paths after cancellation:", err);
  }

  return {
    success: true,
    orderId: data?.order_id || orderId,
    paymentStatus: nextPaymentStatus,
    statusDescription: data?.status_description,
    statusHistory: data?.status_history,
    statusUpdatedAt: data?.status_updated_at,
  };
}
