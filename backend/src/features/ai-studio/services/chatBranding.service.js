import { DEFAULT_CHAT_THEME } from "../chatTheme.defaults.js";

/** Reliable boolean for guest chat voucher flow (Mongo Mixed / JSON may vary). */
export function normalizeDiscountEnabled(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no" || s === "") return false;
  }
  return false;
}

/**
 * Merge stored theme with defaults; shallow merge for top-level keys only.
 * Booleans (e.g. discountEnabled: false) must not be treated like empty strings.
 */
export function mergeChatTheme(partial) {
  if (!partial || typeof partial !== "object") {
    return { ...DEFAULT_CHAT_THEME };
  }
  const merged = { ...DEFAULT_CHAT_THEME };
  for (const key of Object.keys(partial)) {
    const val = partial[key];
    if (val === undefined || val === null) continue;
    if (typeof val === "boolean") {
      merged[key] = val;
      continue;
    }
    if (typeof val === "number") {
      merged[key] = val;
      continue;
    }
    if (val === "") continue;
    merged[key] = val;
  }
  merged.discountEnabled = normalizeDiscountEnabled(merged.discountEnabled);
  return merged;
}

export function resolveThemeForApi(agent) {
  const name = agent?.agentDisplayName || "";
  const merged = mergeChatTheme(agent?.chatTheme || {});
  if (!merged.brandName && name) merged.brandName = name;
  merged.discountEnabled = normalizeDiscountEnabled(merged.discountEnabled);
  return merged;
}
