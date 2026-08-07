"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  category_slug: z.string().min(1, "Category is required"),
  dimensions: z.string().min(1, "Dimensions are required").max(50),
  price_per_sqft: z.number().positive("Price must be a positive number").finite(),
  image: z.string().max(500).optional().default("/images/tiles/floor_porcelain.png"),
  finish: z.string().max(50).optional().default(""),
  application: z.string().max(50).optional().default(""),
  stock_sqft: z.number().min(0, "Stock cannot be negative").finite(),
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

// ── Server Actions ─────────────────────────────────────

export async function createCategory(rawData: { name: string; slug: string; image: string }) {
  // Validate untrusted input with Zod
  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  await requireAdmin(supabase);

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

  revalidatePath("/admin/inventory");
  revalidatePath("/collections");
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
  // Validate untrusted input with Zod
  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  await requireAdmin(supabase);

  // Generate a sequential ID like "tile-123"
  // Using UUID for robust identification instead to avoid sequence issues
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

  revalidatePath("/admin/inventory");
  revalidatePath("/collections");
  revalidatePath("/");
  return { success: true };
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
