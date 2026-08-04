"use server";

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function createCategory(data: { name: string; slug: string; image: string }) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("categories")
    .insert({
      name: data.name,
      slug: data.slug,
      image: data.image || "/images/tiles/floor_porcelain.png"
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/collections");
  return { success: true };
}

export async function createProduct(data: {
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
      image: data.image || "/images/tiles/floor_porcelain.png",
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
