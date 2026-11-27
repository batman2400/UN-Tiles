import { NextResponse } from "next/server";
import { getRawCatalogPayload } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getRawCatalogPayload({ remote: true });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
