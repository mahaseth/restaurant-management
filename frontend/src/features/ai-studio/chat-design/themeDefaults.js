/** Default chat theme (keep aligned with backend `chatTheme.defaults.js`). */
export const DEFAULT_CHAT_THEME = {
  brandName: "",
  brandTagline: "",
  primaryColor: "#2563eb",
  loadingBg: "#06080a",
  loadingTextColor: "#cbd5e1",
  welcomeHeading: "Welcome — explore our menu and recommendations.",
  welcomeSubtext: "",
  loadingText: "Preparing your dining guide",
  introHeading: "Hi there!",
  introBody:
    "I'm here to help you browse our menu, prices, and specials. Ask me anything about what we serve!",
  endChatLabel: "End Chat",
  discountEnabled: false,
  discountPercent: "5%",
  voucherHeading: "Thank you!",
  voucherBody: "We hope you enjoy your visit.",
  voucherBannerLabel: "End chat to receive your discount voucher",
  couponPageHeading: "Your Voucher",
  couponPageSubtext: "Show this to staff to claim your discount.",
  thinkingTextStyle: "casual",
  headerBg: "#ffffff",
  headerText: "#0f172a",
  userBubbleBg: "#2563eb",
  userBubbleText: "#ffffff",
  botBubbleBg: "#f1f5f9",
  botBubbleText: "#0f172a",
  composerBg: "#ffffff",
  pageBg: "#f8fafc",
  pageBgFlat: "#f1f5f9",
  backgroundSharpness: 100,
  welcomeBg: "#06080a",
  welcomeTextColor: "#cbd5e1",
  welcomeSubtextColor: "#94a3b8",
  loadingGlowColor: "#3b82f6",
  voucherBannerBg: "#f59e0b",
  voucherBannerText: "#ffffff",
  voucherModalBg: "#ffffff",
  voucherHeaderBg: "#2563eb",
  voucherHeaderText: "#ffffff",
  voucherCardBg: "#ffffff",
  voucherBodyBg: "#eff6ff",
  voucherBodyText: "#1d4ed8",
  voucherPrimaryButtonBg: "#2563eb",
  voucherPrimaryButtonText: "#ffffff",
  voucherSecondaryButtonBg: "#0f172a",
  voucherSecondaryButtonText: "#ffffff",
};

/** Copy / behaviour fields (not auto-derived from primary). */
export const THEME_COPY_KEYS = [
  "brandName",
  "brandTagline",
  "loadingText",
  "welcomeHeading",
  "welcomeSubtext",
  "introHeading",
  "introBody",
  "endChatLabel",
  "discountEnabled",
  "discountPercent",
  "voucherHeading",
  "voucherBody",
  "voucherBannerLabel",
  "couponPageHeading",
  "couponPageSubtext",
  "thinkingTextStyle",
  "backgroundSharpness",
];

/**
 * Optional chrome colors — when set, they override the palette derived from `primaryColor`
 * (GPTA-style per-screen design studio).
 */
export const COLOR_OVERRIDE_KEYS = [
  "loadingBg",
  "loadingTextColor",
  "loadingGlowColor",
  "welcomeBg",
  "welcomeTextColor",
  "welcomeSubtextColor",
  "headerBg",
  "headerText",
  "composerBg",
  "userBubbleBg",
  "userBubbleText",
  "botBubbleBg",
  "botBubbleText",
  "pageBg",
  "pageBgFlat",
  "voucherBannerBg",
  "voucherBannerText",
  "voucherModalBg",
  "voucherHeaderBg",
  "voucherHeaderText",
  "voucherCardBg",
  "voucherBodyBg",
  "voucherBodyText",
  "voucherPrimaryButtonBg",
  "voucherPrimaryButtonText",
  "voucherSecondaryButtonBg",
  "voucherSecondaryButtonText",
];

export function mergeWithDefaults(partial) {
  return { ...DEFAULT_CHAT_THEME, ...(partial || {}) };
}

/** Fields persisted to the API (copy + primary + optional per-screen color overrides). */
export function pickChatThemeForSave(t) {
  const keys = [...new Set(["primaryColor", ...THEME_COPY_KEYS, ...COLOR_OVERRIDE_KEYS])];
  const o = {};
  for (const k of keys) {
    const v = t[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") {
      o[k] = v;
      continue;
    }
    if (typeof v === "number") {
      o[k] = v;
      continue;
    }
    if (typeof v === "string" && v === "") continue;
    o[k] = v;
  }
  return o;
}
