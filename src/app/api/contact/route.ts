import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Validation ─────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  email: z.string().trim().email("Please provide a valid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message is too long"),
  company: z.string().trim().max(150).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  projectType: z.string().trim().max(100).optional().default(""),
});

// ── Route Handler ──────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 5, 60 * 1000, "contact");
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many contact inquiries submitted. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString(),
        },
      }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please provide a valid name, email address, and message.",
        },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { error: "Contact submissions are temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .from("inquiries")
      .insert({
        name: data.name,
        email: data.email,
        message: data.message,
        company: data.company || null,
        phone: data.phone || null,
        project_type: data.projectType || null,
      });

    if (insertError) {
      console.error("Inquiry insert error:", insertError);
      return Response.json(
        { error: "We couldn't save your inquiry right now. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Your inquiry has been received.",
    });
  } catch (error) {
    console.error("Unexpected contact API error:", error);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
