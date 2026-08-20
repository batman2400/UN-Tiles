import { GoogleGenAI, Type } from "@google/genai";
import type { SceneBrief } from "./types";
import { sanitizeSceneBrief } from "./scene-filters";

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
- "floor": polished marble, travertine, terracotta, limestone, wood-look porcelain, and slate for living rooms, dining rooms, halls, foyers, bedrooms, and indoor flooring.
- "wall": decorative wall ceramics, zellige, metro subway, and metallic slabs for backsplashes, shower walls, fireplace surrounds, and feature walls.
- "mosaics": kit-kat finger tiles and geometric sheets for vanity backsplashes, niches, and shower pans.
- "pool-tiles": ONLY swimming pools, outdoor spas, fountains, and submerged aquatic features.

CRITICAL ARCHITECTURAL RULES:
1. targetCategory — choose EXACTLY ONE:
   - "pool-tiles" ONLY if the photo clearly shows a swimming pool, plunge pool, outdoor spa, fountain basin, or underwater mosaic. Water reflections on an indoor floor do NOT count.
   - "floor" for indoor living rooms, dining rooms, halls, hallways, foyers, bedrooms, kitchens (floor), retail interiors, and banquet halls.
   - "wall" for bathroom walls, backsplashes, shower walls, fireplace surrounds, feature accent walls.
   - "mosaics" for kit-kat / geometric mosaic swatches or vanity backsplashes.
   - "all" if multi-surface or ambiguous — never default indoor rooms to pool-tiles.
2. Glossy, wet-looking, or highly reflective marble in a hall, dining room, or living room is still FLOOR. Never call it a pool.
3. NEVER set targetCategory to "pool-tiles" for a hall, dining room, living room, bedroom, kitchen, foyer, lobby, or bathroom.
4. roomType must be specific and honest (e.g. "Dining Room", "Grand Hall", "Luxury Living Room", "Modern Hallway", "Master Bathroom", "Swimming Pool"). Do not invent a pool if furniture, a table, chairs, a chandelier, or a corridor is visible.
5. idealTileQuery: ONE sentence (12-25 words) naming indoor floor/wall material, finish, and tone. For halls and dining rooms always specify "floor tile" (porcelain, marble-look, wood-look, travertine). Never mention pool, aquatic, or submerged mosaic for indoor rooms.
6. Extract 4 to 5 hex colors (#RRGGBB).
7. styleTags: 3 to 4 aesthetic tags. Do not use tags like "Poolside" or "Aquatic" unless the photo is actually a pool.
8. surfaces: "Floor" for halls and dining rooms unless the photo is clearly a wall/backsplash.
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

      return sanitizeSceneBrief(parsed);
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
