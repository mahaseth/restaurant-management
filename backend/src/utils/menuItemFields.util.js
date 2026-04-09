/** Optional menu fields for RAG / guest safety. All optional; backward compatible. */

export const SPICE_LEVELS = ["mild", "medium", "hot"];

const MAX_LIST_ITEMS = 40;
const MAX_STRING_LEN = 120;
const MAX_CUISINE_LEN = 80;

/**
 * Normalize a list from array or comma/newline-separated string.
 * @returns {string[]|undefined} undefined if input absent/invalid; empty array if explicitly empty
 */
export function normalizeStringList(val) {
  if (val === undefined) return undefined;
  if (val === null) return [];
  if (Array.isArray(val)) {
    const out = val
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .map((s) => s.slice(0, MAX_STRING_LEN))
      .slice(0, MAX_LIST_ITEMS);
    return out;
  }
  if (typeof val === "string") {
    const out = val
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.slice(0, MAX_STRING_LEN))
      .slice(0, MAX_LIST_ITEMS);
    return out;
  }
  return undefined;
}

export function normalizeSpiceLevel(val) {
  if (val === undefined || val === null || val === "") return undefined;
  const s = String(val).trim().toLowerCase();
  if (!s) return undefined;
  if (SPICE_LEVELS.includes(s)) return s;
  return undefined;
}

export function normalizeCuisineType(val) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim().slice(0, MAX_CUISINE_LEN);
  return s || undefined;
}

/**
 * Optional / RAG fields only (for create merge or partial updates).
 */
export function sanitizeMenuItemOptionalFields(body) {
  if (!body || typeof body !== "object") return { fields: {}, unsetSpiceLevel: false };
  const fields = {};
  let unsetSpiceLevel = false;

  if (body.ingredients !== undefined) fields.ingredients = normalizeStringList(body.ingredients) ?? [];
  if (body.allergens !== undefined) fields.allergens = normalizeStringList(body.allergens) ?? [];
  if (body.dietaryTags !== undefined) fields.dietaryTags = normalizeStringList(body.dietaryTags) ?? [];

  if (Object.prototype.hasOwnProperty.call(body, "spiceLevel")) {
    if (body.spiceLevel === "" || body.spiceLevel == null) {
      unsetSpiceLevel = true;
    } else {
      const sp = normalizeSpiceLevel(body.spiceLevel);
      if (!sp) {
        throw new Error(`spiceLevel must be one of: ${SPICE_LEVELS.join(", ")}`);
      }
      fields.spiceLevel = sp;
    }
  }

  if (body.cuisineType !== undefined) {
    fields.cuisineType = normalizeCuisineType(body.cuisineType) ?? "";
  }

  return { fields, unsetSpiceLevel };
}

/**
 * Pick safe update fields from request body (avoids arbitrary key injection on PUT).
 */
export function sanitizeMenuItemWritePayload(body) {
  if (!body || typeof body !== "object") return { core: {}, optional: {}, unsetSpiceLevel: false };
  const core = {};

  if (typeof body.name === "string") core.name = body.name.trim();
  if (typeof body.description === "string") core.description = body.description.trim();
  if (body.price !== undefined && body.price !== null) core.price = body.price;
  if (typeof body.category === "string") core.category = body.category.trim().toLowerCase();
  if (typeof body.available === "boolean") core.available = body.available;
  if (typeof body.image === "string") core.image = body.image.trim();

  const { fields: optional, unsetSpiceLevel } = sanitizeMenuItemOptionalFields(body);
  return { core, optional, unsetSpiceLevel };
}
