/**
 * RAG query intent (keyword flags) and retrieval metadata for menu chat.
 * We do not use embedding-similarity thresholds to route or block the guest reply; the main
 * replying model always runs with the top-k retrieved rows (or empty context). `topSimilarity`
 * and `confidence` are informational for logs / API only.
 */

import { parseMenuCatalogAttributes } from "./menuRecommendations.util.js";

/**
 * Keyword-based flags only — not a full intent classifier.
 * @param {string} userText
 */
export function detectMenuQueryIntent(userText) {
  const raw = String(userText || "");
  const allergenFocus =
    /\b(allerg|allergic|allergy|peanut|peanuts|tree\s*nut|nuts?\b|dairy|milk\b|lactose|gluten|wheat|soy|sesame|shellfish|seafood|egg\b|eggs)\b/i.test(
      raw
    );
  const dietaryFocus =
    /\b(vegan|vegetarian|\bveg\b|halal|kosher|gluten[-\s]?free|dairy[-\s]?free|nut[-\s]?free|keto|paleo)\b/i.test(
      raw
    );
  const ingredientFocus =
    /\b(ingredient|what'?s\s+in|whats\s+in|contain|contains|made\s+with|is\s+there|does\s+it\s+have)\b/i.test(
      raw
    );
  const recommendationIntent =
    /\b(recommend|suggestion|suggest|what\s+should|best|popular|good\s+for|try\b)\b/i.test(raw);

  const selfReportedAllergyOrIntolerance =
    /\b(i\s*'?m\s+allergic|i\s+have\s+an?\s+allergy|i\s+can\s*'?t\s+eat|allergic\s+to|allergy\s+to|celiac|coeliac|lactose\s+intolerant)\b/i.test(
      raw
    );

  const strictSafetyMode = Boolean(allergenFocus || dietaryFocus);

  return {
    allergenFocus,
    dietaryFocus,
    ingredientFocus,
    recommendationIntent,
    selfReportedAllergyOrIntolerance,
    strictSafetyMode,
  };
}

/**
 * @param {Array<{ similarity?: number }>} contextRows
 * @param {ReturnType<typeof detectMenuQueryIntent>} _intent
 * @returns {{ confidence: "high"|"none", topSimilarity: number|null, thresholds: { applied: false } }}
 *          Telemetry only: "high" if at least one neighbor was returned, "none" if retrieval was empty (not a similarity band).
 */
export function computeRetrievalConfidence(contextRows, _intent) {
  if (!Array.isArray(contextRows) || contextRows.length === 0) {
    return {
      confidence: "none",
      topSimilarity: null,
      thresholds: { applied: false },
    };
  }
  const topSim = Number(contextRows[0]?.similarity);
  const sim = Number.isFinite(topSim) ? topSim : 0;
  return {
    confidence: "high",
    topSimilarity: sim,
    thresholds: { applied: false },
  };
}

export function buildMatchedMenuItemsSummary(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const attrs = parseMenuCatalogAttributes(r);
    const sim = r?.similarity;
    return {
      menuItemId: attrs.menuItemId ? String(attrs.menuItemId) : "",
      name: typeof attrs.name === "string" ? attrs.name : "",
      similarity: sim != null && Number.isFinite(Number(sim)) ? Number(Number(sim).toFixed(4)) : null,
    };
  });
}
