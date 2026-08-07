import { NextRequest, NextResponse } from "next/server";

// ── Validation ─────────────────────────────────────────

function isValidBody(body: unknown): body is { name: string; email: string; message: string; company?: string; phone?: string; projectType?: string } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" && b.name.trim().length > 0 &&
    typeof b.email === "string" && b.email.trim().length > 0 &&
    typeof b.message === "string" && b.message.trim().length > 0
  );
}

// ── Route Handler ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      console.error("WEB3FORMS_ACCESS_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
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

    if (!res.ok) {
      const text = await res.text();
      console.error("Web3Forms API error:", text);
      return NextResponse.json(
        { error: "Email delivery failed. Your inquiry was still saved." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Web3Forms route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
