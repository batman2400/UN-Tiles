"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_CACHE_TAG, invalidateLocalCatalogCache } from "@/data/products";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";

// ── Zod Schemas ────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  image: z.string().max(500).optional().default("/images/tiles/floor_porcelain.png"),
});

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  category_slug: z.string().min(1, "Category is required"),
  dimensions: z.string().min(1, "Dimensions are required").max(50),
  price_per_sqft: z.number().positive("Price must be a positive number").finite(),
  image: z.string().max(500).optional().default("/images/tiles/floor_porcelain.png"),
  finish: z.string().max(50).optional().default(""),
  application: z.string().max(50).optional().default(""),
  stock_sqft: z.number().min(0, "Stock cannot be negative").finite(),
});

const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  amount: z.number().finite("Amount must be a number"),
});

const bulkStockAdjustSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Select at least one product"),
  amount: z.number().finite("Amount must be a number"),
});

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

const orderStatusSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  newStatus: z.enum(ORDER_STATUSES),
  statusDescription: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
});

const bulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "Select at least one order"),
  newStatus: z.enum(ORDER_STATUSES),
  statusDescription: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
});

const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product is required"),
});

// ── Auth Guard ─────────────────────────────────────────

/**
 * Ensures the currently authenticated user is an admin.
 */
async function requireAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

function revalidateCatalog(paths: string[] = ["/admin/inventory", "/collections", "/"]) {
  invalidateLocalCatalogCache();
  updateTag(CATALOG_CACHE_TAG);
  for (const path of paths) {
    revalidatePath(path);
  }
}

// ── Server Actions ─────────────────────────────────────

export async function createCategory(rawData: { name: string; slug: string; image: string }) {
  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("categories")
    .insert({
      name: data.name,
      slug: data.slug,
      image: data.image,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(supabase, {
    adminId: admin.id,
    adminEmail: admin.email,
    action: "category.created",
    entityType: "category",
    entityId: data.slug,
    details: { name: data.name },
  });

  revalidateCatalog(["/admin/inventory", "/collections"]);
  return { success: true };
}

export async function createProduct(rawData: {
  sku: string;
  name: string;
  category_slug: string;
  dimensions: string;
  price_per_sqft: number;
  image: string;
  finish: string;
  application: string;
  stock_sqft: number;
}) {
  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);

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

  const { error } = await supabase
    .from("products")
    .insert({
      id: id,
      sku: data.sku,
      name: data.name,
      category_slug: data.category_slug,
      dimensions: data.dimensions,
      price_per_sqft: data.price_per_sqft,
      image: data.image,
      finish: data.finish,
      application: data.application,
      stock_sqft: data.stock_sqft,
      featured: false
    });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(supabase, {
    adminId: admin.id,
    adminEmail: admin.email,
    action: "product.created",
    entityType: "product",
    entityId: id,
    details: { sku: data.sku, name: data.name, stock_sqft: data.stock_sqft },
  });

  revalidateCatalog();
  return { success: true };
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
  const admin = await requireAdmin(supabase);

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

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_sqft: newStock })
    .eq("id", productId);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  await logAdminAction(supabase, {
    adminId: admin.id,
    adminEmail: admin.email,
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
  const admin = await requireAdmin(supabase);

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
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_sqft: newStock })
      .eq("id", product.id);

    if (updateError) {
      failed.push({ id: product.id, error: updateError.message });
      continue;
    }

    updates.push({ id: product.id, newStock });
    succeededIds.push(product.id);
  }

  if (succeededIds.length > 0) {
    await logAdminAction(supabase, {
      adminId: admin.id,
      adminEmail: admin.email,
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
  const admin = await requireAdmin(supabase);

  const { data: product, error: readError } = await supabase
    .from("products")
    .select("id, sku, name")
    .eq("id", productId)
    .single();

  if (readError || !product) {
    return { success: false as const, error: readError?.message || "Product not found." };
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    return { success: false as const, error: deleteError.message };
  }

  await logAdminAction(supabase, {
    adminId: admin.id,
    adminEmail: admin.email,
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
  const admin = await requireAdmin(supabase);

  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id, status, status_history")
    .eq("id", orderId)
    .single();

  if (readError || !order) {
    return { success: false as const, error: readError?.message || "Order not found." };
  }

  const previousStatus = order.status;
  const now = new Date().toISOString();

  // Format existing history and append new transition entry
  const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];
  const historyEntry = {
    status: newStatus,
    description: cleanDescription,
    timestamp: now,
    updated_by: admin.email || "Admin",
  };
  const updatedHistory = [...existingHistory, historyEntry];

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      status_description: cleanDescription,
      status_history: updatedHistory,
      status_updated_at: now,
    })
    .eq("id", orderId);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  await logAdminAction(supabase, {
    adminId: admin.id,
    adminEmail: admin.email,
    action: "order.status_updated",
    entityType: "order",
    entityId: orderId,
    details: {
      from: previousStatus,
      to: newStatus,
      description: cleanDescription,
    },
  });

  if (previousStatus === "Cancelled" || newStatus === "Cancelled") {
    revalidateCatalog();
  }

  return {
    success: true as const,
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
  const admin = await requireAdmin(supabase);

  const { data: orders, error: readError } = await supabase
    .from("orders")
    .select("id, status, status_history")
    .in("id", orderIds);

  if (readError) {
    return { success: false as const, error: readError.message };
  }

  const succeededIds: string[] = [];
  const failed: { id: string; error: string }[] = [];
  let touchedStock = false;
  const now = new Date().toISOString();

  for (const order of orders ?? []) {
    const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];
    const historyEntry = {
      status: newStatus,
      description: cleanDescription,
      timestamp: now,
      updated_by: admin.email || "Admin",
    };
    const updatedHistory = [...existingHistory, historyEntry];

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        status_description: cleanDescription,
        status_history: updatedHistory,
        status_updated_at: now,
      })
      .eq("id", order.id);

    if (updateError) {
      failed.push({ id: order.id, error: updateError.message });
      continue;
    }

    if (order.status === "Cancelled" || newStatus === "Cancelled") {
      touchedStock = true;
    }
    succeededIds.push(order.id);
  }

  if (succeededIds.length > 0) {
    await logAdminAction(supabase, {
      adminId: admin.id,
      adminEmail: admin.email,
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
  }

  if (touchedStock) {
    revalidateCatalog();
  }

  return { success: true as const, succeededIds, failed };
}

// ── Profile Update (server-side with field whitelisting) ───

const profileSchema = z.object({
  firstName: z.string().max(100).optional().default(""),
  lastName: z.string().max(100).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  email: z.string().email("Invalid email").max(255),
});

export async function updateUserProfile(rawData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const parsed = profileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not logged in" };
  }

  // Whitelist only safe columns — role is NEVER included
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
