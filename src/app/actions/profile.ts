"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const profileSchema = z.object({
  firstName: z.string().trim().max(100).optional().default(""),
  lastName: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
});

export async function updateUserProfile(rawData: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const parsed = profileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not logged in" };
  }

  // Whitelist only safe mutable columns — role and email are NEVER updated here
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
