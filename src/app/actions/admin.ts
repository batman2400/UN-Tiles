"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { CATALOG_CACHE_TAG } from "@/data/products";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import { indexProduct } from "@/lib/visual-search/indexProduct";
import { refundPaidOrder } from "@/lib/orderRefund";

const DEFAULT_TILE_IMAGE = "/tiles/floor_agaria.jpg";

function isAllowedCatalogImage(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/tiles/") || trimmed.startsWith("/images/")) {
    return !trimmed.includes("..") && !trimmed.includes("\\");
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let allowedHost = "jnihpfdrqrdmxebbabmj.supabase.co";
    if (configuredUrl) {
      try {
        allowedHost = new URL(configuredUrl).hostname;
      } catch {
        // Keep fallback host
      }
    }
    return (
      parsed.hostname === allowedHost &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

const imageFieldSchema = z
  .string()
  .max(500)
  .refine(isAllowedCatalogImage, "Image must be a local /tiles/ or /images/ asset or a Supabase Storage URL")
  .optional();

// ── Zod Schemas ────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  image: imageFieldSchema,
});

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  category_slug: z.string().min(1, "Category is required"),
  dimensions: z.string().min(1, "Dimensions are required").max(50),
  price_per_sqft: z.number().positive("Price must be a positive number").finite(),
  image: imageFieldSchema,
  finish: z.string().max(50).optional().default(""),
  application: z.string().max(50).optional().default(""),
  stock_sqft: z.number().min(0, "Stock cannot be negative").finite(),
});

const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  amount: z.number().int("Amount must be a whole number (sq ft)").finite(),
});

const bulkStockAdjustSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Select at least one product"),
  amount: z.number().int("Amount must be a whole number (sq ft)").finite(),
});

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

const orderStatusSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  newStatus: z.enum(ORDER_STATUSES),
  statusDescription: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
});

const bulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "Select at least one order"),
  newStatus: z.enum(ORDER_STATUSES),
  statusDescription: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
});

const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product is required"),
});

const updateProductSchema = productSchema.omit({ stock_sqft: true }).extend({
  id: z.string().min(1, "Product is required"),
});

// ── Auth Guard ─────────────────────────────────────────

async function requireAdminSafe(
  supabase: SupabaseClient
): Promise<{ ok: true; user: { id: string; email?: string } } | { ok: false; error: string }> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: "Session expired. Please sign in again." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return { ok: false, error: "Forbidden: Admin access required." };
    }

    return { ok: true, user: { id: user.id, email: user.email } };
  } catch {
    return { ok: false, error: "Authentication check failed. Please sign in again." };
  }
}

function validateOrderTransition(currentStatus: string, nextStatus: string): string | null {
  if (currentStatus === "Cancelled" && nextStatus !== "Cancelled") {
    return "Cancelled orders cannot be reopened.";
  }
  if (currentStatus === "Delivered" && nextStatus === "Cancelled") {
    return "Delivered orders cannot be cancelled.";
  }
  if (currentStatus === "Shipped" && nextStatus === "Cancelled") {
    return "Shipped orders cannot be cancelled online.";
  }
  return null;
}

function revalidateCatalog(
  paths: string[] = ["/admin", "/admin/inventory", "/collections", "/", "/planner", "/sitemap.xml"]
) {
  updateTag(CATALOG_CACHE_TAG);
  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath("/collections/[id]", "page");
}

function revalidateOrderViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/profile");
}

// ── Server Actions ─────────────────────────────────────

export async function createCategory(rawData: { name: string; slug: string; image?: string }) {
  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;
  const resolvedImage = data.image?.trim() || DEFAULT_TILE_IMAGE;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await supabase.from("categories").insert({
    name: data.name,
    slug: data.slug,
    image: resolvedImage,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "category.created",
    entityType: "category",
    entityId: data.slug,
    details: { name: data.name },
  });

  revalidateCatalog(["/admin", "/admin/inventory", "/collections", "/", "/planner", "/sitemap.xml"]);
  return { success: true };
}

export async function createProduct(rawData: {
  sku: string;
  name: string;
  category_slug: string;
  dimensions: string;
  price_per_sqft: number;
  image?: string;
  finish: string;
  application: string;
  stock_sqft: number;
}) {
  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;
  const resolvedImage = data.image?.trim() || DEFAULT_TILE_IMAGE;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const { data: existingSku } = await supabase
    .from("products")
    .select("id, name")
    .eq("sku", data.sku)
    .limit(1)
    .maybeSingle();

  if (existingSku) {
    return {
      success: false,
      error: `SKU "${data.sku}" already exists on "${existingSku.name}". Restock that product instead of creating a duplicate.`,
    };
  }

  const id = "tile-" + crypto.randomUUID().split("-")[0];

  const { error } = await supabase.from("products").insert({
    id,
    sku: data.sku,
    name: data.name,
    category_slug: data.category_slug,
    dimensions: data.dimensions,
    price_per_sqft: data.price_per_sqft,
    image: resolvedImage,
    finish: data.finish,
    application: data.application,
    stock_sqft: data.stock_sqft,
    featured: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "product.created",
    entityType: "product",
    entityId: id,
    details: { sku: data.sku, name: data.name, stock_sqft: data.stock_sqft },
  });

  if (resolvedImage) {
    try {
      after(async () => {
        try {
          await indexProduct(id, resolvedImage);
        } catch (embedErr) {
          console.warn(`[Admin Action] Background indexProduct failed for ${id}:`, embedErr);
        }
      });
    } catch (afterErr) {
      console.warn("[Admin Action] after() hook unavailable:", afterErr);
    }
  }

  revalidateCatalog();
  return { success: true };
}

export async function updateProduct(rawData: {
  id: string;
  sku: string;
  name: string;
  category_slug: string;
  dimensions: string;
  price_per_sqft: number;
  image?: string;
  finish: string;
  application: string;
}) {
  const parsed = updateProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;
  const resolvedImage = data.image?.trim() || DEFAULT_TILE_IMAGE;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id, sku, image")
    .eq("id", data.id)
    .single();

  if (fetchError || !existing) {
    return { success: false as const, error: fetchError?.message || "Product not found." };
  }

  const { data: duplicateSku } = await supabase
    .from("products")
    .select("id, name")
    .eq("sku", data.sku)
    .neq("id", data.id)
    .limit(1)
    .maybeSingle();

  if (duplicateSku) {
    return {
      success: false as const,
      error: `SKU "${data.sku}" is already used by "${duplicateSku.name}".`,
    };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      sku: data.sku,
      name: data.name,
      category_slug: data.category_slug,
      dimensions: data.dimensions,
      price_per_sqft: data.price_per_sqft,
      image: resolvedImage,
      finish: data.finish,
      application: data.application,
    })
    .eq("id", data.id);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "product.updated",
    entityType: "product",
    entityId: data.id,
    details: { sku: data.sku, name: data.name, price_per_sqft: data.price_per_sqft },
  });

  if (resolvedImage && resolvedImage !== existing.image) {
    try {
      after(async () => {
        try {
          await indexProduct(data.id, resolvedImage);
        } catch (embedErr) {
          console.warn(`[Admin Action] Background indexProduct failed for ${data.id}:`, embedErr);
        }
      });
    } catch (afterErr) {
      console.warn("[Admin Action] after() hook unavailable:", afterErr);
    }
  }

  revalidateCatalog();
  return {
    success: true as const,
    product: {
      id: data.id,
      sku: data.sku,
      name: data.name,
      category_slug: data.category_slug,
      dimensions: data.dimensions,
      price_per_sqft: data.price_per_sqft,
      image: resolvedImage,
      finish: data.finish,
      application: data.application,
    },
  };
}

export async function adjustProductStock(rawData: { productId: string; amount: number }) {
  const parsed = stockAdjustSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const { productId, amount } = parsed.data;

  if (amount === 0) {
    return { success: false as const, error: "Enter a non-zero amount to restock." };
  }

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: product, error: readError } = await supabase
    .from("products")
    .select("id, sku, stock_sqft")
    .eq("id", productId)
    .single();

  if (readError || !product) {
    return { success: false as const, error: readError?.message || "Product not found." };
  }

  const previousStock = Number(product.stock_sqft);
  const newStock = Math.max(0, previousStock + amount);

  const { data: updatedRows, error: updateError } = await supabase
    .from("products")
    .update({ stock_sqft: newStock })
    .eq("id", productId)
    .eq("stock_sqft", previousStock)
    .select("id");

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }
  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false as const,
      error: "Stock changed concurrently. Refresh and try again.",
    };
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "product.stock_updated",
    entityType: "product",
    entityId: productId,
    details: { sku: product.sku, from: previousStock, to: newStock, amount },
  });

  revalidateCatalog();
  return { success: true as const, newStock, previousStock };
}

export async function bulkAdjustProductStock(rawData: { productIds: string[]; amount: number }) {
  const parsed = bulkStockAdjustSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const { productIds, amount } = parsed.data;

  if (amount === 0) {
    return { success: false as const, error: "Enter a non-zero amount to restock." };
  }

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: products, error: readError } = await supabase
    .from("products")
    .select("id, sku, stock_sqft")
    .in("id", productIds);

  if (readError) {
    return { success: false as const, error: readError.message };
  }

  const updates: { id: string; newStock: number }[] = [];
  const failed: { id: string; error: string }[] = [];
  const succeededIds: string[] = [];

  for (const product of products ?? []) {
    const previousStock = Number(product.stock_sqft);
    const newStock = Math.max(0, previousStock + amount);
    const { data: updatedRows, error: updateError } = await supabase
      .from("products")
      .update({ stock_sqft: newStock })
      .eq("id", product.id)
      .eq("stock_sqft", previousStock)
      .select("id");

    if (updateError) {
      failed.push({ id: product.id, error: updateError.message });
      continue;
    }
    if (!updatedRows || updatedRows.length === 0) {
      failed.push({ id: product.id, error: "Stock changed concurrently." });
      continue;
    }

    updates.push({ id: product.id, newStock });
    succeededIds.push(product.id);
  }

  if (succeededIds.length > 0) {
    await logAdminAction(supabase, {
      adminId: auth.user.id,
      adminEmail: auth.user.email,
      action: "product.bulk_restock",
      entityType: "product",
      entityId: succeededIds.join(","),
      details: { count: succeededIds.length, amount, productIds: succeededIds },
    });
    revalidateCatalog();
  }

  return { success: true as const, updates, failed };
}

export async function deleteProduct(rawData: { productId: string }) {
  const parsed = deleteProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const { productId } = parsed.data;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: product, error: readError } = await supabase
    .from("products")
    .select("id, sku, name")
    .eq("id", productId)
    .single();

  if (readError || !product) {
    return { success: false as const, error: readError?.message || "Product not found." };
  }

  const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);

  if (deleteError) {
    return { success: false as const, error: deleteError.message };
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "product.deleted",
    entityType: "product",
    entityId: productId,
    details: { sku: product.sku, name: product.name },
  });

  revalidateCatalog();
  return { success: true as const };
}

export async function updateOrderStatus(rawData: {
  orderId: string;
  newStatus: string;
  statusDescription?: string | null;
}) {
  const parsed = orderStatusSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const { orderId, newStatus, statusDescription } = parsed.data;
  const cleanDescription = statusDescription?.trim() || null;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id, status, status_history, payment_status, payment_details")
    .eq("id", orderId)
    .single();

  if (readError || !order) {
    return { success: false as const, error: readError?.message || "Order not found." };
  }

  const previousStatus = order.status;
  const transitionError = validateOrderTransition(previousStatus, newStatus);
  if (transitionError) {
    return { success: false as const, error: transitionError };
  }

  const now = new Date().toISOString();
  const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];
  const historyEntry = {
    status: newStatus,
    description: cleanDescription,
    timestamp: now,
    updated_by: auth.user.email || "Admin",
  };
  const updatedHistory = [...existingHistory, historyEntry];

  const { data: updatedRows, error: updateError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      status_description: cleanDescription,
      status_history: updatedHistory,
      status_updated_at: now,
    })
    .eq("id", orderId)
    .eq("status", previousStatus)
    .select("id");

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }
  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false as const,
      error: "Order status changed concurrently. Refresh and try again.",
    };
  }

  let nextPaymentStatus = order.payment_status as string | null;
  if (previousStatus !== "Cancelled" && newStatus === "Cancelled" && order.payment_status === "Paid") {
    const refundOutcome = await refundPaidOrder(
      orderId,
      order.payment_details as Record<string, unknown> | null
    );
    nextPaymentStatus = refundOutcome.paymentStatus;
  }

  await logAdminAction(supabase, {
    adminId: auth.user.id,
    adminEmail: auth.user.email,
    action: "order.status_updated",
    entityType: "order",
    entityId: orderId,
    details: {
      from: previousStatus,
      to: newStatus,
      description: cleanDescription,
      payment_status: nextPaymentStatus,
    },
  });

  if (previousStatus === "Cancelled" || newStatus === "Cancelled") {
    revalidateCatalog();
  }
  revalidateOrderViews();

  return {
    success: true as const,
    paymentStatus: nextPaymentStatus,
    statusDescription: cleanDescription,
    statusHistory: updatedHistory,
    statusUpdatedAt: now,
  };
}

export async function bulkUpdateOrderStatus(rawData: {
  orderIds: string[];
  newStatus: string;
  statusDescription?: string | null;
}) {
  const parsed = bulkOrderStatusSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const { orderIds, newStatus, statusDescription } = parsed.data;
  const cleanDescription = statusDescription?.trim() || null;

  const supabase = await createClient();
  const auth = await requireAdminSafe(supabase);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: orders, error: readError } = await supabase
    .from("orders")
    .select("id, status, status_history, payment_status, payment_details")
    .in("id", orderIds);

  if (readError) {
    return { success: false as const, error: readError.message };
  }

  const succeededIds: string[] = [];
  const paymentStatusById: Record<string, string> = {};
  const failed: { id: string; error: string }[] = [];
  let touchedStock = false;
  const now = new Date().toISOString();

  for (const order of orders ?? []) {
    const transitionError = validateOrderTransition(order.status, newStatus);
    if (transitionError) {
      failed.push({ id: order.id, error: transitionError });
      continue;
    }

    const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];
    const historyEntry = {
      status: newStatus,
      description: cleanDescription,
      timestamp: now,
      updated_by: auth.user.email || "Admin",
    };
    const updatedHistory = [...existingHistory, historyEntry];

    const { data: updatedRows, error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        status_description: cleanDescription,
        status_history: updatedHistory,
        status_updated_at: now,
      })
      .eq("id", order.id)
      .eq("status", order.status)
      .select("id");

    if (updateError) {
      failed.push({ id: order.id, error: updateError.message });
      continue;
    }
    if (!updatedRows || updatedRows.length === 0) {
      failed.push({ id: order.id, error: "Order status changed concurrently." });
      continue;
    }

    if (order.status !== "Cancelled" && newStatus === "Cancelled" && order.payment_status === "Paid") {
      const refundOutcome = await refundPaidOrder(
        order.id,
        order.payment_details as Record<string, unknown> | null
      );
      paymentStatusById[order.id] = refundOutcome.paymentStatus;
    }

    if (order.status === "Cancelled" || newStatus === "Cancelled") {
      touchedStock = true;
    }
    succeededIds.push(order.id);
  }

  if (succeededIds.length > 0) {
    await logAdminAction(supabase, {
      adminId: auth.user.id,
      adminEmail: auth.user.email,
      action: "order.bulk_status_updated",
      entityType: "order",
      entityId: succeededIds.join(","),
      details: {
        count: succeededIds.length,
        to: newStatus,
        description: cleanDescription,
        orderIds: succeededIds,
      },
    });
    revalidateOrderViews();
  }

  if (touchedStock) {
    revalidateCatalog();
  }

  return { success: true as const, succeededIds, paymentStatusById, failed };
}
