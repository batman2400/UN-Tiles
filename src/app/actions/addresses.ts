"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import type { SavedAddress } from "@/lib/address";

const addressSchema = z.object({
  label: z.string().trim().max(80).optional().default("Home"),
  line1: z.string().trim().min(1, "Enter a street address.").max(200),
  line2: z.string().trim().max(200).optional().default(""),
});

function asSavedAddress(row: {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  country: string | null;
}): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    country: row.country,
  };
}

export async function listAddresses(): Promise<{
  success: boolean;
  addresses: SavedAddress[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, addresses: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, line1, line2, country")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, addresses: [], error: error.message };
  }

  return { success: true, addresses: (data ?? []).map(asSavedAddress) };
}

export async function createAddress(raw: {
  label: string;
  line1: string;
  line2: string;
}): Promise<{ success: boolean; address?: SavedAddress; error?: string }> {
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid address" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required. Please log in." };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      label: parsed.data.label || "Home",
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      country: "Sri Lanka",
    })
    .select("id, label, line1, line2, country")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Could not save the address." };
  }

  return { success: true, address: asSavedAddress(data) };
}

export async function deleteAddress(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: "Address is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
