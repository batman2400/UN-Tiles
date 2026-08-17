"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const cancelOrderSchema = z.object({
  orderId: z.string().trim().min(1, "Order ID is required"),
  reason: z.string().trim().max(500, "Reason must be under 500 characters").optional(),
});

export interface CancelOrderResult {
  success: boolean;
  orderId?: string;
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

  // Revalidate catalog inventory and order views
  try {
    revalidatePath("/collections");
    revalidatePath("/profile");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
  } catch (err) {
    console.error("Failed to revalidate paths after cancellation:", err);
  }

  return {
    success: true,
    orderId: data?.order_id || orderId,
    statusDescription: data?.status_description,
    statusHistory: data?.status_history,
    statusUpdatedAt: data?.status_updated_at,
  };
}
