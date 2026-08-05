import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ── Validation ─────────────────────────────────────────

interface ContactRequestBody {
  name: string;
  email: string;
  message: string;
  company?: string;
  phone?: string;
  projectType?: string;
}

function isValidContactBody(body: unknown): body is ContactRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email) &&
    typeof candidate.message === "string" &&
    candidate.message.trim().length > 0
  );
}

// ── Route Handler ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 2. Validate required fields
    if (!isValidContactBody(body)) {
      return Response.json(
        {
          error:
            "Please provide a valid name, email address, and message.",
        },
        { status: 400 }
      );
    }

    // 3. Initialize Supabase client & save to database
    const supabase = await createClient();

    const { error: insertError } = await supabase
      .from("inquiries")
      .insert({
        name: body.name.trim(),
        email: body.email.trim(),
        message: body.message.trim(),
      });

    if (insertError) {
      console.error("Inquiry insert error:", insertError);
      return Response.json(
        { error: "We couldn't save your inquiry right now. Please try again." },
        { status: 500 }
      );
    }

    // 4. Send email notification via Web3Forms
    try {
      const web3FormsRes = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "38b1e744-4baa-4b00-be82-402dd2797666",
          subject: `New UN Tiles Inquiry from ${body.name}`,
          from_name: "UN Tiles Contact Form",
          name: body.name,
          email: body.email,
          company: body.company || "N/A",
          phone: body.phone || "N/A",
          projectType: body.projectType || "N/A",
          message: body.message,
        }),
      });

      if (!web3FormsRes.ok) {
        console.error("Web3Forms error:", await web3FormsRes.text());
      }
    } catch (web3Error) {
      console.error("Web3Forms fetch error:", web3Error);
      // We still return success to the user since the DB insert succeeded
    }

    // 5. Success
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
