import {
  DEFAULT_CHAT_THEME,
  mergeWithDefaults,
  THEME_COPY_KEYS,
  COLOR_OVERRIDE_KEYS,
} from "@/features/ai-studio/chat-design/themeDefaults";
import { deriveChatPalette } from "./brandingPalette.js";

const THINKING_BY_STYLE = {
  classy: ["One moment…"],
  professional: ["Reviewing your question…", "Checking the menu…"],
  casual: ["Thinking…", "One sec…", "Almost there…"],
  funny: ["Cooking up an answer…"],
  humor: ["Polishing this…"],
};

export function getThinkingMessagesForStyle(style) {
  const s = style && THINKING_BY_STYLE[style] ? style : "casual";
  return THINKING_BY_STYLE[s] || THINKING_BY_STYLE.casual;
}

/** Normalize API / DB values (booleans, 0/1, "true"/"false" strings). */
export function parseDiscountEnabled(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no" || s === "") return false;
  }
  return false;
}

export function isDiscountEnabled(theme) {
  return parseDiscountEnabled(theme?.discountEnabled);
}

/**
 * Merge API theme with defaults, apply palette derived from `primaryColor`, then apply any
 * explicit per-screen color overrides (GPTA-style design studio).
 */
export function resolveTheme(partial, agentName) {
  const base = mergeWithDefaults(partial || {});
  if (!base.brandName && agentName) base.brandName = agentName;

  const primary = base.primaryColor || DEFAULT_CHAT_THEME.primaryColor;
  const derived = deriveChatPalette(primary);

  const content = {};
  for (const key of THEME_COPY_KEYS) {
    const v = base[key];
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean" || typeof v === "number") {
      content[key] = v;
      continue;
    }
    if (typeof v === "string" && v === "") continue;
    content[key] = v;
  }

  const colorOverrides = {};
  for (const key of COLOR_OVERRIDE_KEYS) {
    const v = base[key];
    if (typeof v !== "string" || v.trim() === "") continue;
    colorOverrides[key] = v.trim();
  }

  const resolved = {
    ...derived,
    ...colorOverrides,
    ...content,
    primaryColor: primary,
  };
  resolved.discountEnabled = parseDiscountEnabled(resolved.discountEnabled);
  return resolved;
}

export { DEFAULT_CHAT_THEME };
