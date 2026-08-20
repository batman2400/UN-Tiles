import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { getRawCatalogPayload } from "../data/products";
import { indexProduct } from "../lib/visual-search/indexProduct";

async function main() {
  console.log("\n========================================================");
  console.log(" UN TILES — Gemini Visual Search Catalog Seeder");
  console.log(" Model: gemini-embedding-2:v3 (768-d + caption + colour)");
  console.log("========================================================\n");

  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const onlyId = onlyArg?.slice("--only=".length);

  if (force) {
    console.log(" Mode: Force re-embedding.\n");
  }

  // Verify environment variables
  if (!process.env.GEMINI_EMBED_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: Missing GEMINI_EMBED_API_KEY in .env.local");
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  console.log("📦 Loading catalog products...");
  const payload = await getRawCatalogPayload();
  const allProducts = onlyId
    ? payload.products.filter((product) => product.id === onlyId)
    : payload.products;
  if (onlyId && allProducts.length === 0) {
    console.error(`No catalog product found with id "${onlyId}".`);
    process.exit(1);
  }
  console.log(`Found ${allProducts.length} catalog products to process.\n`);

  let indexedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const DELAY_MS = 1500; // 1.5s delay to stay comfortably below rate limits

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    const indexStr = `[${i + 1}/${allProducts.length}]`;
    process.stdout.write(`${indexStr} ${product.name} (${product.id})... `);

    try {
      const result = await indexProduct(product.id, product.image, force);

      if (result.status === "indexed") {
        console.log(`✅ INDEXED`);
        indexedCount++;
      } else if (result.status === "skipped") {
        console.log(`⏩ SKIPPED (${result.message || "up to date"})`);
        skippedCount++;
      } else {
        console.log(`❌ FAILED: ${result.message}`);
        failedCount++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.log(`❌ EXCEPTION: ${message}`);
      failedCount++;
    }

    if (i < allProducts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log("\n========================================================");
  console.log(" Seeding Summary:");
  console.log(` - Total Products:  ${allProducts.length}`);
  console.log(` - Newly Indexed:   ${indexedCount}`);
  console.log(` - Skipped (Valid): ${skippedCount}`);
  console.log(` - Failed:          ${failedCount}`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
