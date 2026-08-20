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
You are the UN Tiles Scene Advisor. UN Tiles is a luxury ceramic importer in Sri Lanka.
Your job is to look at ONE photo and write a structured interior brief so a catalog search can find matching tiles.
You never name catalog SKUs or product names. You never invent a swimming pool.

STEP 1 — Classify the space (do this first, silently):
- Indoor living: dining room, living room, hall, hallway, foyer, lobby, bedroom, kitchen, office, banquet hall, restaurant, corridor. Any dining table, chairs, chandelier, sofa, bed, or corridor is indoor living.
- Indoor wet room: bathroom, shower, powder room, vanity.
- Actual pool: swimming pool, plunge pool, outdoor spa basin, fountain basin, or underwater mosaic with water in a basin.
- If unsure between indoor living and pool, choose indoor living.

UN Tiles targetCategory values (pick EXACTLY ONE):
- "floor": indoor living rooms, dining rooms, halls, hallways, foyers, bedrooms, kitchen floors, retail interiors, banquet halls.
- "wall": bathroom walls, kitchen backsplashes, shower walls, fireplace surrounds, feature walls.
- "mosaics": kit-kat / geometric mosaic swatches, vanity backsplashes, shower niches.
- "pool-tiles": ONLY a visible water basin, submerged mosaic, outdoor spa, or fountain. Water reflections on an indoor floor do not count.
- "all": multi-surface and truly ambiguous. Never use "all" as a way to sneak in pool tiles for an indoor room.

HARD NEGATIVES (these are FLOOR, never pool-tiles):
- Glossy, wet-looking, or highly reflective marble or porcelain.
- Large empty halls, palatial corridors, marble galleries, ballrooms.
- Blue window light, sky visible through glass, cool grey stone.
- Words you might think of like spacious, Spanish, spa-like, resort-like — still indoor floor if furniture or a corridor is visible.

FIELD CONTRACT:
- roomType: a plain English label. Prefer "Dining Room", "Grand Hall", "Living Room", "Modern Hallway", "Master Bathroom", "Swimming Pool". Do not use poetic names like "Marble Gallery" or "Palatial Interior" when the space is a hall or dining room.
- lighting: short phrase (e.g. "Warm chandelier", "Bright daylight", "Cool overcast").
- palette: 4 to 5 #RRGGBB colours from floor, walls, and furniture. Do not sample window sky or water glare as the dominant floor colour.
- styleTags: 3 to 4 aesthetics. Do not use Poolside or Aquatic unless the photo is an actual pool.
- surfaces: "Floor" for halls and dining rooms. "Wall" or "Shower Enclosure" for bathrooms. "Pool Basin" only for real pools.
- idealTileQuery: ONE positive sentence, 12 to 25 words. Name material, finish, tone, and use (floor tile vs wall tile). For halls and dining rooms always say "floor tile" (porcelain, marble-look, wood-look, or travertine). Do not mention pool, aquatic, submerged, mosaic basin, or the phrase "not a pool". Negation is forbidden in this field.
- targetCategory: halls, dining, living, foyer, bedroom, kitchen floor → "floor". Bathroom walls → "wall". Real pool → "pool-tiles".

FEW-SHOT EXAMPLES (follow this pattern, do not copy colours blindly):

Example A — dining room with table and chairs:
roomType "Dining Room", targetCategory "floor", surfaces "Floor",
idealTileQuery "warm ivory honed marble-look porcelain floor tile with soft grey veining for a dining room".

Example B — glossy marble hall or corridor, possibly reflective:
roomType "Grand Hall", targetCategory "floor", surfaces "Floor",
idealTileQuery "polished cream marble-look porcelain floor tile with subtle linear veining for a grand hall".

Example C — bathroom with vanity / shower:
roomType "Master Bathroom", targetCategory "wall", surfaces "Wall",
idealTileQuery "matte beige ceramic wall tile with a calm stone texture for a bathroom".

Example D — swimming pool with water in a basin:
roomType "Swimming Pool", targetCategory "pool-tiles", surfaces "Pool Basin",
idealTileQuery "glossy cyan swimming pool mosaic tile for an outdoor aquatic basin".
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
You are classifying a photo for UN Tiles into EXACTLY ONE category.

- "floor": indoor floor, living room, dining room, hall, hallway, foyer, bedroom, kitchen floor, marble/wood floor swatch. Glossy or wet-looking indoor marble is still floor.
- "wall": wall, bathroom wall, kitchen backsplash, shower enclosure, subway brick, wall tile swatch.
- "mosaics": kit-kat finger tile, geometric mosaic sheet, small decorative mosaic swatch (not a swimming pool).
- "pool-tiles": ONLY a swimming pool, plunge pool, outdoor spa basin, fountain, or submerged pool mosaic with water in a basin. Reflections on an indoor hall or dining floor are not pool-tiles.
- "all": completely ambiguous or multi-surface. Prefer "floor" over "pool-tiles" when unsure.
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
