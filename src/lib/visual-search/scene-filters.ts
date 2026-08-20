import type { SceneBrief } from "./types";

type TileCategory = NonNullable<SceneBrief["targetCategory"]>;

const INDOOR_LIVING_RE =
  /\b(dining|living|lounge|hall|hallway|foyer|entryway|entrance|bedroom|kitchen|office|study|corridor|lobby|salon|sitting|family|banquet|restaurant|reception|drawing|gallery|atrium|vestibule|ballroom|chamber|mansion|palace|penthouse|passage|open[\s-]?plan)\b/i;

const INDOOR_WET_ROOM_RE =
  /\b(bathroom|washroom|restroom|shower|toilet|powder|ensuite|en-suite|vanity|laundry)\b/i;

const BACKSPLASH_OR_WALL_RE =
  /\b(backsplash|feature wall|accent wall|shower wall|bathroom wall)\b/i;

/**
 * True pool / submerged spaces only.
 * Do NOT use a bare `/spa/` — it matches "spacious" and "Spanish".
 * Evidence comes from roomType + surfaces, not the ideal-tile sentence (Vision can hallucinate "pool" there).
 */
const AQUATIC_RE =
  /\b(swimming\s*pools?|plunge\s*pools?|infinity\s*pools?|lap\s*pools?|pool\s*(basin|liner|deck|mosaic|tile)s?|underwater|submerged|hot\s*tubs?|jacuzzis?|outdoor\s*spas?|water\s*features?)\b/i;

const STANDALONE_POOL_RE = /\bpools?\b/i;

export type SceneCatalogFilter = {
  allowedCategories?: string[];
  excludeCategories?: string[];
};

export function isIndoorLivingSpace(scene: SceneBrief): boolean {
  return INDOOR_LIVING_RE.test(scene.roomType) || INDOOR_LIVING_RE.test(scene.surfaces);
}

export function isIndoorWetRoom(scene: SceneBrief): boolean {
  return INDOOR_WET_ROOM_RE.test(scene.roomType) || INDOOR_WET_ROOM_RE.test(scene.surfaces);
}

export function isClearlyAquaticSpace(scene: SceneBrief): boolean {
  if (isIndoorLivingSpace(scene) || isIndoorWetRoom(scene)) {
    return false;
  }

  const evidence = `${scene.roomType} ${scene.surfaces}`;
  return AQUATIC_RE.test(evidence) || STANDALONE_POOL_RE.test(evidence);
}

function prefersWallSurface(scene: SceneBrief): boolean {
  const haystack = `${scene.surfaces} ${scene.idealTileQuery}`;
  if (/\bfloor\b/i.test(haystack) && !BACKSPLASH_OR_WALL_RE.test(haystack)) {
    return false;
  }
  return BACKSPLASH_OR_WALL_RE.test(haystack) || /^\s*walls?\b/i.test(scene.surfaces || "");
}

function indoorDefaultCategory(scene: SceneBrief): TileCategory {
  return prefersWallSurface(scene) ? "wall" : "floor";
}

/**
 * Correct Vision mistakes: glossy indoor halls are still floor, not pool.
 * If the space is not clearly aquatic, never keep targetCategory "pool-tiles".
 */
export function sanitizeSceneBrief(scene: SceneBrief): SceneBrief {
  const aquatic = isClearlyAquaticSpace(scene);
  let targetCategory: TileCategory = scene.targetCategory || "all";
  let idealTileQuery = scene.idealTileQuery?.trim() || "";
  let surfaces = scene.surfaces;

  if (aquatic) {
    return {
      ...scene,
      targetCategory: "pool-tiles",
      idealTileQuery,
      surfaces,
    };
  }

  if (targetCategory === "pool-tiles") {
    targetCategory = indoorDefaultCategory(scene);
  }

  if (/\b(pool|aquatic|underwater|submerged)\b/i.test(idealTileQuery)) {
    idealTileQuery = prefersWallSurface(scene)
      ? "matte ceramic wall tile that complements this indoor interior"
      : "honed porcelain floor tile for this indoor residential space";
  }

  if (/\b(pool|aquatic)\b/i.test(surfaces)) {
    surfaces = prefersWallSurface(scene) ? "Wall" : "Floor";
  }

  if (isIndoorLivingSpace(scene) && !prefersWallSurface(scene)) {
    targetCategory = "floor";
  } else if (isIndoorWetRoom(scene) && targetCategory === "all") {
    targetCategory = prefersWallSurface(scene) ? "wall" : "floor";
  }

  return {
    ...scene,
    targetCategory,
    idealTileQuery,
    surfaces,
  };
}

/**
 * Pool SKUs are allowed only when the room itself is aquatic.
 * Never trust Vision targetCategory === "pool-tiles" alone.
 */
export function resolveSceneCatalogFilter(scene: SceneBrief): SceneCatalogFilter {
  if (isClearlyAquaticSpace(scene)) {
    return { allowedCategories: ["pool-tiles"] };
  }

  if (isIndoorLivingSpace(scene)) {
    if (prefersWallSurface(scene)) {
      return { allowedCategories: ["wall", "mosaics"], excludeCategories: ["pool-tiles"] };
    }
    return { allowedCategories: ["floor"], excludeCategories: ["pool-tiles"] };
  }

  if (isIndoorWetRoom(scene)) {
    return {
      allowedCategories: ["wall", "mosaics", "floor"],
      excludeCategories: ["pool-tiles"],
    };
  }

  if (scene.targetCategory === "floor") {
    return { allowedCategories: ["floor"], excludeCategories: ["pool-tiles"] };
  }
  if (scene.targetCategory === "wall") {
    return { allowedCategories: ["wall"], excludeCategories: ["pool-tiles"] };
  }
  if (scene.targetCategory === "mosaics") {
    return { allowedCategories: ["mosaics"], excludeCategories: ["pool-tiles"] };
  }

  return { excludeCategories: ["pool-tiles"] };
}

/** Positive retrieval sentence only. Do not mention pool on indoor queries — negation attracts pool SKUs. */
export function buildSceneSearchQuery(scene: SceneBrief): string {
  const query = scene.idealTileQuery.trim();
  if (isClearlyAquaticSpace(scene)) {
    return `swimming pool mosaic tile. ${query}`;
  }
  if (isIndoorLivingSpace(scene)) {
    const surface = prefersWallSurface(scene) ? "wall" : "floor";
    return `indoor residential ${surface} porcelain tile for a ${scene.roomType}. ${query}`;
  }
  if (isIndoorWetRoom(scene)) {
    return `indoor bathroom ceramic tile for a ${scene.roomType}. ${query}`;
  }
  return `indoor porcelain tile. ${query}`;
}
