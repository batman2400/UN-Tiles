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

UN Tiles Catalog Context:
- Floor Tiles: polished marble slabs, natural travertine, terracotta, limestone, natural oak wood-look porcelain planks, and slate for living rooms, dining rooms, hallways, foyers, bedrooms, and general indoor flooring.
- Wall Tiles: decorative wall ceramics, zellige artisan tiles, metro subway bricks, and metallic slabs for backsplashes, shower walls, fireplace surrounds, and feature walls.
- Mosaics: fluted kit-kat finger tiles and geometric sheets for vanity backsplashes, niche accents, and shower pans.
- Pool Tiles: ONLY for swimming pools, outdoor spas, fountains, and submerged aquatic features.

CRITICAL ARCHITECTURAL RULES:
1. For indoor living spaces (Living Room, Dining Room, Hallway, Foyer, Bedroom, Kitchen Floor), recommend authentic residential FLOOR or WALL tiles (e.g., honed travertine, polished marble, natural oak planks, matte limestone, terracotta, fluted wall batons). NEVER suggest pool tiles for standard indoor living rooms, dining rooms, or hallways.
2. For roomType, identify the space accurately (e.g., "Dining Room", "Luxury Living Room", "Modern Hallway", "Contemporary Kitchen", "Master Bathroom", "Outdoor Patio", "Swimming Pool").
3. For idealTileQuery, write ONE short, descriptive sentence (12-25 words) specifying the ideal tile material, finish, tone, and texture to harmonize with this space (e.g., "warm ivory honed travertine porcelain floor tile with subtle linear veining" or "natural honey oak wood-look porcelain plank tile for warm dining room flooring").
4. Extract 4 to 5 dominant and accent hex colors from the room (e.g., ["#F4EFEA", "#C9B8A2", "#685F54", "#2B2824"]). Ensure valid #RRGGBB format.
5. styleTags: 3 to 4 design aesthetic tags (e.g., ["Minimalist", "Warm Japandi", "Modern Industrial", "Contemporary Luxury"]).
6. surfaces: Which tile surfaces are prominent or recommended for this space (e.g., "Floor", "Floor & Feature Wall", "Kitchen Backsplash", "Shower Enclosure").
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
            },
            required: [
              "roomType",
              "lighting",
              "palette",
              "styleTags",
              "surfaces",
              "idealTileQuery",
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
      // If it's not a 404 (e.g. rate limit, auth error, bad json), throw immediately or report
      throw err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed to analyze scene with Gemini Vision models.");
}
