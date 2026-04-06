/**
 * Derives full chat chrome colors from one primary brand color.
 * Layout, typography, and motion stay fixed in components — only palette changes.
 */

export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return { r: 37, g: 99, b: 235 };
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return { r: 37, g: 99, b: 235 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Mix two hex colors; t=0 → a, t=1 → b */
export function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

export function hexAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * @param {string} primaryHex e.g. #2563eb
 * @returns {Record<string, string>} theme color fields for ChatThemeProvider
 */
export function deriveChatPalette(primaryHex) {
  const p = primaryHex && /^#?[0-9a-fA-F]{3,8}$/.test(primaryHex.trim())
    ? primaryHex.startsWith("#")
      ? primaryHex
      : `#${primaryHex}`
    : "#2563eb";

  const slate900 = "#0f172a";
  const slate800 = "#1e293b";
  const slate100 = "#f1f5f9";
  const white = "#ffffff";

  const pageTint = mixHex("#f8fafc", p, 0.12);
  const botBubble = mixHex(slate100, p, 0.08);
  const voucherBodyMuted = mixHex(slate800, p, 0.35);

  /** GPTA default: solid stage (#06080a); overrides may be gradients from design studio */
  const stageSolid = "#06080a";

  return {
    primaryColor: p,
    headerBg: "rgba(255,255,255,0.78)",
    headerText: slate900,
    userBubbleBg: p,
    userBubbleText: white,
    botBubbleBg: botBubble,
    botBubbleText: slate800,
    composerBg: "rgba(255,255,255,0.96)",
    pageBg: `linear-gradient(180deg, ${hexAlpha(p, 0.07)} 0%, ${pageTint} 45%, #eef2f7 100%)`,
    pageBgFlat: pageTint,

    loadingBg: stageSolid,
    loadingTextColor: "#e2e8f0",
    loadingGlowColor: p,

    welcomeBg: stageSolid,
    welcomeTextColor: "#f8fafc",
    welcomeSubtextColor: "#94a3b8",

    voucherHeaderBg: p,
    voucherHeaderText: white,
    voucherModalBg: white,
    voucherCardBg: mixHex(white, p, 0.04),
    voucherBodyBg: hexAlpha(p, 0.06),
    voucherBodyText: voucherBodyMuted,
    voucherPrimaryButtonBg: p,
    voucherPrimaryButtonText: white,
    voucherSecondaryButtonBg: slate900,
    voucherSecondaryButtonText: white,
    voucherBannerBg: mixHex("#f59e0b", p, 0.15),
    voucherBannerText: white,
  };
}
