import { NextResponse } from "next/server";
import { getRawCatalogPayload } from "@/data/products";

export const revalidate = 86400; // Cache on edge for 24 hours

export async function GET() {
  const payload = await getRawCatalogPayload({ remote: false });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}