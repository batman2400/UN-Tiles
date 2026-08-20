import type { SceneBrief } from "./types";

type TileCategory = NonNullable<SceneBrief["targetCategory"]>;

const INDOOR_LIVING_RE =
  /\b(dining|living|lounge|hall|hallway|foyer|entryway|entrance|bedroom|kitchen|office|study|corridor|lobby|salon|sitting|family|banquet|restaurant|reception|drawing|great room|villa|apartment)\b/i;

const INDOOR_WET_ROOM_RE =
  /\b(bathroom|washroom|restroom|shower|toilet|powder|ensuite|en-suite|vanity|laundry)\b/i;

const BACKSPLASH_OR_WALL_RE =
  /\b(backsplash|feature wall|accent wall|shower wall|bathroom wall)\b/i;

/**
 * True pool / submerged spaces only.
 * Do NOT use a bare `/spa/` — it matches "spacious" and "Spanish".
 */
const AQUATIC_RE =
  /\b(swimming\s*pools?|plunge\s*pools?|infinity\s*pools?|lap\s*pools?|pool\s*(basin|liner|deck|mosaic|tile)s?|underwater|submerged|hot\s*tubs?|jacuzzis?|outdoor\s*spas?|water\s*features?)\b/i;

const STANDALONE_POOL_RE = /\bpools?\b/i;

export type SceneCatalogFilter = {
  allowedCategories?: string[];
  excludeCategories?: string[];
};

function sceneHaystack(scene: SceneBrief): string {
  return [
    scene.roomType,
    scene.surfaces,
    scene.idealTileQuery,
    ...(scene.styleTags || []),
  ]
    .filter(Boolean)
    .join(" ");
}

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

  const haystack = sceneHaystack(scene);
  if (AQUATIC_RE.test(haystack)) {
    return true;
  }

  if (scene.targetCategory === "pool-tiles" && STANDALONE_POOL_RE.test(haystack)) {
    return true;
  }

  return false;
}

function prefersWallSurface(scene: SceneBrief): boolean {
  const haystack = `${scene.surfaces} ${scene.idealTileQuery}`;
  return BACKSPLASH_OR_WALL_RE.test(haystack) && !/\bfloor\b/i.test(haystack);
}

/**
 * Correct Vision mistakes: glossy indoor halls are still floor, not pool.
 */
export function sanitizeSceneBrief(scene: SceneBrief): SceneBrief {
  const aquatic = isClearlyAquaticSpace(scene);
  let targetCategory: TileCategory = scene.targetCategory || "all";
  let idealTileQuery = scene.idealTileQuery?.trim() || "";
  let surfaces = scene.surfaces;

  if (!aquatic && (isIndoorLivingSpace(scene) || isIndoorWetRoom(scene))) {
    if (targetCategory === "pool-tiles") {
      targetCategory = prefersWallSurface(scene) ? "wall" : "floor";
    }

    if (/\b(pool|aquatic|underwater|submerged)\b/i.test(idealTileQuery)) {
      idealTileQuery = prefersWallSurface(scene)
        ? "matte ceramic wall tile that complements this indoor interior"
        : "honed porcelain floor tile for this indoor residential space";
    }

    if (/\b(pool|aquatic)\b/i.test(surfaces)) {
      surfaces = prefersWallSurface(scene) ? "Wall" : "Floor";
    }
  }

  if (aquatic) {
    targetCategory = "pool-tiles";
  } else if (isIndoorLivingSpace(scene) && !prefersWallSurface(scene)) {
    targetCategory = "floor";
  }

  return {
    ...scene,
    targetCategory,
    idealTileQuery,
    surfaces,
  };
}

export function resolveSceneCatalogFilter(scene: SceneBrief): SceneCatalogFilter {
  if (isClearlyAquaticSpace(scene) || scene.targetCategory === "pool-tiles") {
    if (!isIndoorLivingSpace(scene) && !isIndoorWetRoom(scene)) {
      return { allowedCategories: ["pool-tiles"] };
    }
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

export function buildSceneSearchQuery(scene: SceneBrief): string {
  const query = scene.idealTileQuery.trim();
  if (isClearlyAquaticSpace(scene)) {
    return `${query} swimming pool mosaic tile`;
  }
  if (isIndoorLivingSpace(scene)) {
    const surface = prefersWallSurface(scene) ? "wall" : "floor";
    return `indoor residential ${surface} porcelain tile for a ${scene.roomType}. ${query}. not a swimming pool tile`;
  }
  if (isIndoorWetRoom(scene)) {
    return `indoor bathroom ceramic tile for a ${scene.roomType}. ${query}. not a swimming pool tile`;
  }
  return `${query}. indoor tile, not swimming pool mosaic`;
}
