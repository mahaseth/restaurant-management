/**
 * Lightweight RAG confidence + query intent for menu chat safety.
 * Thresholds are pragmatic defaults for cosine-style similarity from pgvector (1 - distance).
 * Tune via env MENU_RAG_SIM_HIGH / MENU_RAG_SIM_LOW / MENU_RAG_SIM_HIGH_STRICT / MENU_RAG_SIM_LOW_STRICT (0–1 floats).
 */

import { parseMenuCatalogAttributes } from "./menuRecommendations.util.js";

function envFloat(name, fallback) {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function getSimilarityThresholds(intent) {
  // Strict thresholds only when the guest states a personal allergy/intolerance — not for
  // "vegetarian options", "does X contain dairy?", etc. Those still get careful LLM prompts.
  const strict = Boolean(intent?.selfReportedAllergyOrIntolerance);
  if (strict) {
    return {
      high: envFloat("MENU_RAG_SIM_HIGH_STRICT", 0.7),
      low: envFloat("MENU_RAG_SIM_LOW_STRICT", 0.54),
      strict: true,
    };
  }
  return {
    high: envFloat("MENU_RAG_SIM_HIGH", 0.65),
    low: envFloat("MENU_RAG_SIM_LOW", 0.48),
    strict: false,
  };
}

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

  /** Guest says they cannot eat something / have an allergy — highest bar for canned fallback. */
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
 * Uses the top retrieved row's DB similarity after keyword re-ranking (first row in `contextRows`).
 * @param {Array<{ similarity?: number }>} contextRows
 * @param {ReturnType<typeof detectMenuQueryIntent>} intent
 */
export function computeRetrievalConfidence(contextRows, intent) {
  const thresholds = getSimilarityThresholds(intent);
  if (!Array.isArray(contextRows) || contextRows.length === 0) {
    return {
      confidence: "none",
      topSimilarity: null,
      thresholds,
    };
  }
  const topSim = Number(contextRows[0]?.similarity);
  const sim = Number.isFinite(topSim) ? topSim : 0;
  if (sim >= thresholds.high) {
    return { confidence: "high", topSimilarity: sim, thresholds };
  }
  if (sim >= thresholds.low) {
    return { confidence: "low", topSimilarity: sim, thresholds };
  }
  return { confidence: "none", topSimilarity: sim, thresholds };
}

/**
 * When true, skip the LLM and return a canned safe reply (no dish hallucination path).
 * We only hard-block on weak retrieval when the guest personally reports an allergy/intolerance;
 * other diet/ingredient questions use the LLM with MENU CONTEXT + safety instructions.
 */
export function shouldForceRetrievalFallback(confidence, intent) {
  if (confidence === "none") return true;
  if (confidence === "low" && intent.selfReportedAllergyOrIntolerance) return true;
  return false;
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

/**
 * Canned copy in restaurant voice; avoids model invention when context is unsafe or missing.
 */
export function buildFallbackAssistantText(intent) {
  if (intent.selfReportedAllergyOrIntolerance) {
    return (
      "We don't have enough clear information in our menu details here to answer that safely. " +
      "For allergies, ingredients, or special diets, please check with our staff before ordering — " +
      "they can confirm with the kitchen."
    );
  }
  return (
    "We're not finding a close enough match in the menu information we have right now. " +
    "Our team can help with what's available — ask a staff member, or browse the menu on your screen."
  );
}
