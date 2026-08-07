import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import catalogSeed from "@/data/catalog.json";

export async function GET() {
  try {
    const supabase = await createClient();

    // Require admin authentication before allowing seed
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }
    let categoriesCount = 0;
    let productsCount = 0;
    const errors: string[] = [];

    // 1. Seed Categories
    for (const category of catalogSeed.categories) {
      const { error } = await supabase.from("categories").upsert(
        {
          slug: category.slug,
          name: category.name,
          image: category.image,
        },
        { onConflict: "slug" }
      );

      if (error) {
        errors.push(`Category ${category.slug}: ${error.message}`);
      } else {
        categoriesCount++;
      }
    }

    // 2. Seed Products
    for (const product of catalogSeed.products) {
      const { error } = await supabase.from("products").upsert(
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          dimensions: product.dimensions,
          price_per_sqft: product.pricePerSqFt,
          image: product.image,
          category_slug: product.categorySlug,
          featured: product.featured,
          finish: product.finish,
          application: product.application,
          stock_sqft: 500, // Objective 1.4: Assign initial stock value of 500
        },
        { onConflict: "id" }
      );

      if (error) {
        errors.push(`Product ${product.id}: ${error.message}`);
      } else {
        productsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seeding complete",
      seeded: {
        categories: categoriesCount,
        products: productsCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
