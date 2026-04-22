import { NextResponse } from "next/server";
import { getRawCatalogPayload } from "@/data/products";

export async function GET() {
  const payload = await getRawCatalogPayload({ remote: false });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}