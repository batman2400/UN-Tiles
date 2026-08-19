import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { indexProduct } from "@/lib/visual-search/indexProduct";
import { getCatalogData } from "@/data/products";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Guard: Admin check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin required" }, { status: 403 });
    }

    // 2. Parse request parameters
    const body = await req.json().catch(() => ({}));
    const productId = body.productId;
    const force = Boolean(body.force);

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Missing productId parameter (one product per request)." },
        { status: 400 }
      );
    }

    // 3. Locate product image from catalog or db
    const { allProducts } = await getCatalogData();
    const product = allProducts.find((p) => p.id === productId);

    let imageUrl = product?.image;
    if (!imageUrl) {
      // Fallback: lookup in db
      const { data: dbProduct } = await supabase
        .from("products")
        .select("image")
        .eq("id", productId)
        .single();
      imageUrl = dbProduct?.image;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: `Product "${productId}" not found in catalog or database.` },
        { status: 404 }
      );
    }

    // 4. Index single product
    const result = await indexProduct(productId, imageUrl, force);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (err: unknown) {
    console.error("[Visual Reindex API] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to reindex product.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
