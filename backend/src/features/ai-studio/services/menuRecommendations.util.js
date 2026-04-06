/**
 * Parse assistant reply for :::menu_recommendations::: JSON trailer (GPTA-style dish cards).
 * Returns cleaned text for chat history and a sanitized list for the client.
 */
const MARKER = ":::menu_recommendations:::";

/** Normalize stored menu image URLs for <img src> (Cloudinary, Supabase, etc.). */
export function normalizeMenuImageUrl(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;
  // Relative app paths (same-origin or behind CDN) — still render if browser can resolve
  if (s.startsWith("/")) return s;
  return "";
}

function stripJsonCodeFences(s) {
  let t = String(s).trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```\s*$/i, "");
  return t.trim();
}

/** pg/jsonb may return an object or a JSON string depending on driver config. */
export function parseMenuCatalogAttributes(row) {
  let attrs = row?.attributes;
  if (attrs == null) return {};
  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch {
      return {};
    }
  }
  return typeof attrs === "object" && attrs !== null ? attrs : {};
}

/**
 * True if the assistant text mentions this dish (full name substring, or every significant word).
 */
export function dishMentionedInText(dishName, textLower) {
  const n = (dishName || "").trim().toLowerCase();
  if (!n || !textLower) return false;
  if (textLower.includes(n)) return true;
  const words = n.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length <= 1) return words.length === 1 && textLower.includes(words[0]);
  return words.every((w) => textLower.includes(w));
}

/** Earliest character index used for ordering cards (full phrase, else first matched word). */
function firstMentionPosition(dishName, textLower) {
  const n = (dishName || "").trim().toLowerCase();
  if (!n) return Infinity;
  let pos = textLower.indexOf(n);
  if (pos !== -1) return pos;
  const words = n.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return Infinity;
  const positions = words.map((w) => textLower.indexOf(w)).filter((p) => p >= 0);
  if (positions.length !== words.length) return Infinity;
  return Math.min(...positions);
}

export function extractMenuRecommendationsFromAssistantText(raw) {
  if (!raw || typeof raw !== "string") {
    return { text: "", menuRecommendations: [] };
  }

  const idx = raw.lastIndexOf(MARKER);
  if (idx === -1) {
    return { text: raw.trim(), menuRecommendations: [] };
  }

  let jsonPart = stripJsonCodeFences(raw.slice(idx + MARKER.length));
  const text = raw.slice(0, idx).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    if (!Array.isArray(parsed)) {
      return { text: raw.trim(), menuRecommendations: [] };
    }
    const menuRecommendations = parsed
      .filter((x) => x && typeof x === "object" && typeof x.name === "string" && String(x.name).trim())
      .map((x) => {
        const priceRaw = x.price;
        const price =
          typeof priceRaw === "number" && !Number.isNaN(priceRaw)
            ? priceRaw
            : typeof priceRaw === "string"
              ? Number.parseFloat(priceRaw)
              : NaN;
        const imageUrl = normalizeMenuImageUrl(typeof x.imageUrl === "string" ? x.imageUrl : "");
        return {
          menuItemId: String(x.menuItemId ?? "").slice(0, 64),
          name: String(x.name).trim().slice(0, 200),
          price: Number.isFinite(price) ? price : 0,
          imageUrl,
        };
      })
      .slice(0, 8);
    return { text, menuRecommendations };
  } catch {
    return { text: text.trim(), menuRecommendations: [] };
  }
}

/**
 * When the model omits :::menu_recommendations::: but names dishes from retrieved rows,
 * match MENU CONTEXT rows to the reply and build cards (images from attributes).
 */
export function inferMenuRecommendationsFromReply(assistantText, contextRows) {
  if (!assistantText || !Array.isArray(contextRows) || contextRows.length === 0) return [];
  const lower = assistantText.toLowerCase();
  const candidates = [];

  for (const row of contextRows) {
    const attrs = parseMenuCatalogAttributes(row);
    const name = typeof attrs.name === "string" ? attrs.name.trim() : "";
    const id = String(attrs.menuItemId ?? "").trim();
    if (!name || !id) continue;

    if (!dishMentionedInText(name, lower)) continue;

    const priceRaw = attrs.price;
    const price =
      typeof priceRaw === "number" && !Number.isNaN(priceRaw)
        ? priceRaw
        : Number.parseFloat(String(priceRaw ?? "")) || 0;
    const imageUrl = normalizeMenuImageUrl(typeof attrs.imageUrl === "string" ? attrs.imageUrl : "");

    candidates.push({
      pos: firstMentionPosition(name, lower),
      menuItemId: id,
      name,
      price,
      imageUrl,
    });
  }

  candidates.sort((a, b) => a.pos - b.pos);
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    if (seen.has(c.menuItemId)) continue;
    seen.add(c.menuItemId);
    out.push({
      menuItemId: c.menuItemId,
      name: c.name,
      price: c.price,
      imageUrl: c.imageUrl,
    });
    if (out.length >= 6) break;
  }
  return out;
}

/** When the guest asks broadly ("food", "menu") and inference finds no name matches, still show cards for retrieved rows. */
export function fallbackRecommendationsFromContextRows(contextRows, limit = 6) {
  if (!Array.isArray(contextRows) || contextRows.length === 0) return [];
  const out = [];
  for (const row of contextRows) {
    const attrs = parseMenuCatalogAttributes(row);
    const name = typeof attrs.name === "string" ? attrs.name.trim() : "";
    const id = String(attrs.menuItemId ?? "").trim();
    if (!name || !id) continue;
    const priceRaw = attrs.price;
    const price =
      typeof priceRaw === "number" && !Number.isNaN(priceRaw)
        ? priceRaw
        : Number.parseFloat(String(priceRaw ?? "")) || 0;
    const imageUrl = normalizeMenuImageUrl(typeof attrs.imageUrl === "string" ? attrs.imageUrl : "");
    out.push({ menuItemId: id, name, price, imageUrl });
    if (out.length >= limit) break;
  }
  return out;
}

export function isBroadMenuIntentUserMessage(text) {
  const t = String(text || "")
    .trim()
    .toLowerCase();
  if (!t || t.length > 120) return false;
  return /\b(food|foods|menu|menus|dishes|dish|meal|meals|eat|eating|hungry|what\s+do\s+you\s+(have|serve)|what'?s?\s+(on\s+)?(the\s+)?menu|show\s+(me\s+)?(the\s+)?(menu|foods?)|browse\s+(the\s+)?menu|recommend|suggest|options?)\b/i.test(
    t
  );
}
