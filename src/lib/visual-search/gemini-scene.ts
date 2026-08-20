import { GoogleGenAI, Type } from "@google/genai";
import type { SceneBrief } from "./types";

const PRIMARY_MODEL = "gemini-3.7-flash";
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

function getVisionClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_VISION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_VISION_API_KEY environment variable. " +
      "Please set GEMINI_VISION_API_KEY in your .env.local or deployment environment."
    );
  }
  return new GoogleGenAI({ apiKey });
}

export function isVisionConfigured(): boolean {
  return Boolean(process.env.GEMINI_VISION_API_KEY?.trim());
}

const SCENE_PROMPT = `
You are an expert architectural interior designer for UN Tiles, a luxury tile brand.
Analyze this room/interior photo carefully.

UN Tiles Catalog Categories:
- "floor": polished marble slabs, natural travertine, terracotta, limestone, natural oak wood-look porcelain planks, and slate for living rooms, dining rooms, hallways, foyers, bedrooms, and commercial/residential indoor flooring.
- "wall": decorative wall ceramics, zellige artisan tiles, metro subway bricks, and metallic slabs for backsplashes, shower walls, fireplace surrounds, and feature walls.
- "mosaics": fluted kit-kat finger tiles and geometric sheets for vanity backsplashes, niche accents, and shower pans.
- "pool-tiles": ONLY for swimming pools, outdoor spas, fountains, and submerged aquatic features.

CRITICAL ARCHITECTURAL RULES:
1. For targetCategory: Choose EXACTLY ONE UN Tiles category:
   - "pool-tiles" if and only if the image is a swimming pool, outdoor spa, plunge pool, fountain, or aquatic area.
   - "floor" for indoor living rooms, dining rooms, hallways, retail stores, foyers, bedrooms, and general flooring.
   - "wall" for bathroom walls, backsplashes, shower walls, fireplace surrounds, feature accent walls.
   - "mosaics" for kit-kat finger tiles, geometric mosaic swatches, vanity backsplashes.
   - "all" if multi-surface or ambiguous.
2. For indoor living spaces (Living Room, Dining Room, Hallway, Foyer, Bedroom, Kitchen Floor), recommend authentic residential FLOOR or WALL tiles. NEVER suggest pool tiles for standard indoor living rooms, dining rooms, or hallways.
3. For roomType, identify the space accurately (e.g., "Dining Room", "Luxury Living Room", "Modern Hallway", "Contemporary Kitchen", "Master Bathroom", "Outdoor Patio", "Swimming Pool").
4. For idealTileQuery, write ONE short, descriptive sentence (12-25 words) specifying the ideal tile material, finish, tone, and texture to harmonize with this space (e.g., "warm ivory honed travertine porcelain floor tile with subtle linear veining" or "natural honey oak wood-look porcelain plank tile for warm dining room flooring").
5. Extract 4 to 5 dominant and accent hex colors from the room (e.g., ["#F4EFEA", "#C9B8A2", "#685F54", "#2B2824"]). Ensure valid #RRGGBB format.
6. styleTags: 3 to 4 design aesthetic tags (e.g., ["Minimalist", "Warm Japandi", "Modern Industrial", "Contemporary Luxury"]).
7. surfaces: Which tile surfaces are prominent or recommended for this space (e.g., "Floor", "Floor & Feature Wall", "Kitchen Backsplash", "Shower Enclosure", "Pool Basin").
`;

export async function analyzeScene(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<SceneBrief> {
  const ai = getVisionClient();
  const base64Data = imageBuffer.toString("base64");

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: SCENE_PROMPT,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roomType: { type: Type.STRING },
              lighting: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              styleTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              surfaces: { type: Type.STRING },
              idealTileQuery: { type: Type.STRING },
              targetCategory: {
                type: Type.STRING,
                enum: ["floor", "wall", "mosaics", "pool-tiles", "all"],
              },
            },
            required: [
              "roomType",
              "lighting",
              "palette",
              "styleTags",
              "surfaces",
              "idealTileQuery",
              "targetCategory",
            ],
          },
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error("Gemini Vision returned an empty text response.");
      }

      const parsed = JSON.parse(text) as SceneBrief;

      // Validate structure
      if (!parsed.idealTileQuery || !parsed.roomType) {
        throw new Error("Invalid scene brief response format.");
      }

      // Ensure palette hex codes have # prefix
      if (Array.isArray(parsed.palette)) {
        parsed.palette = parsed.palette.map((c) =>
          c.startsWith("#") ? c.toUpperCase() : `#${c.toUpperCase()}`
        );
      }

      return parsed;
    } catch (err: unknown) {
      lastError = err;
      const errObj = err as { status?: number; message?: string } | undefined;
      const is404 = errObj?.status === 404 || errObj?.message?.includes("404") || errObj?.message?.includes("not found");
      if (is404 && model !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`[Gemini Vision] Model ${model} returned 404, attempting fallback model...`);
        continue;
      }
      throw err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed to analyze scene with Gemini Vision models.");
}

export type TileCategory = "floor" | "wall" | "mosaics" | "pool-tiles" | "all";

const CLASSIFY_PROMPT = `
You are an architectural tile classification AI for UN Tiles.
Inspect this photo (which may be an indoor room, floor, wall, backsplash, pool, or material swatch).
Classify it into EXACTLY ONE UN Tiles category:

- "pool-tiles": If the image is a swimming pool, outdoor spa, plunge pool, fountain, water feature, or submerged pool mosaic.
- "floor": If the image is an indoor floor, living room, dining room, hallway, retail store, bedroom floor, marble floor, wooden floor, or floor tile swatch.
- "wall": If the image is a wall, bathroom wall, kitchen backsplash, shower enclosure, subway brick, or wall tile swatch.
- "mosaics": If the image is a kit-kat finger tile, geometric mosaic sheet, or small decorative mosaic swatch.
- "all": If completely ambiguous or multi-surface.
`;

export async function classifyTileCategory(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<TileCategory> {
  if (!isVisionConfigured()) {
    return "all";
  }

  const ai = getVisionClient();
  const base64Data = imageBuffer.toString("base64");
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: CLASSIFY_PROMPT,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                enum: ["floor", "wall", "mosaics", "pool-tiles", "all"],
              },
              reasoning: {
                type: Type.STRING,
              },
            },
            required: ["category"],
          },
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const text = response.text?.trim();
      if (!text) return "all";
      const parsed = JSON.parse(text) as { category?: TileCategory };
      if (parsed.category && ["floor", "wall", "mosaics", "pool-tiles", "all"].includes(parsed.category)) {
        return parsed.category;
      }
      return "all";
    } catch (err) {
      console.warn(`[Classify Category] Model ${model} failed, trying next...`, err);
    }
  }
  return "all";
}
