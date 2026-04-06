"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useChatTheme } from "../utils/ThemeProvider";
import { isDiscountEnabled } from "../utils/chatTheme";

function withAlpha(color, alpha) {
  if (!color || typeof color !== "string") return `rgba(0,0,0,${alpha})`;
  const normalized = color.trim();
  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  if (hex.length === 3) {
    const r = Number.parseInt(hex[0] + hex[0], 16);
    const g = Number.parseInt(hex[1] + hex[1], 16);
    const b = Number.parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].every((v) => Number.isFinite(v))) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.length === 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].every((v) => Number.isFinite(v))) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/** Ported from GPTA `VoucherModal.tsx` — sparkles header, gift, ornate barcode frame, rounded-full CTAs */
export default function VoucherModal({
  open,
  barcodeUrl,
  onViewFullscreen,
  onContinueChat,
  onEndSession,
  embedded = false,
}) {
  const [imgError, setImgError] = useState(false);
  const theme = useChatTheme();
  const imgSrc = barcodeUrl || null;
  const p = theme.primaryColor || "#2563eb";
  const header = theme.voucherHeaderBg || p;
  const borderColor = withAlpha(header, 0.25);

  if (!open) return null;

  const shell = embedded
    ? "absolute inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 font-sans antialiased"
    : "fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 font-sans antialiased";

  const overlay = (
    <div className={shell}>
      <div
        className="relative w-full max-w-md rounded-3xl border p-6 shadow-2xl"
        style={{ backgroundColor: theme.voucherModalBg || "#fff", borderColor }}
      >
        <div
          className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-3xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${header}, ${withAlpha(header, 0.8)})` }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <i
              className="pi pi-sparkles absolute left-4 top-2 text-2xl"
              style={{ color: theme.voucherHeaderText || "#fff" }}
            />
            <i
              className="pi pi-sparkles absolute right-6 top-3 text-xl"
              style={{ color: theme.voucherHeaderText || "#fff" }}
            />
            <i
              className="pi pi-sparkles absolute bottom-2 left-1/4 text-base"
              style={{ color: theme.voucherHeaderText || "#fff" }}
            />
          </div>
          <i
            className="pi pi-gift mx-auto mb-3 block text-5xl drop-shadow-lg"
            style={{ color: theme.voucherHeaderText || "#fff" }}
          />
          <h2 className="text-3xl font-bold drop-shadow-sm" style={{ color: theme.voucherHeaderText || "#fff" }}>
            {theme.voucherHeading || "Thank you!"}
          </h2>
        </div>

        <div className="mb-4 text-center">
          {theme.brandName ? (
            <h3 className="mb-3 text-xl font-bold" style={{ color: theme.voucherBodyText || "#1e293b" }}>
              {theme.brandName}
            </h3>
          ) : null}

          <button
            type="button"
            className="group relative w-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            onClick={onViewFullscreen}
          >
            <div
              className="relative rounded-2xl border-2 p-1 shadow-lg"
              style={{
                borderColor: withAlpha(header, 0.8),
                background: `linear-gradient(135deg, ${withAlpha(header, 0.16)}, ${withAlpha(header, 0.08)}, ${withAlpha(header, 0.16)})`,
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div
                  className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2"
                  style={{
                    background: `linear-gradient(to bottom, ${withAlpha(header, 0.2)}, ${withAlpha(header, 0.12)}, ${withAlpha(header, 0.2)})`,
                  }}
                />
                <div
                  className="absolute left-0 top-1/2 h-5 w-full -translate-y-1/2"
                  style={{
                    background: `linear-gradient(to right, ${withAlpha(header, 0.2)}, ${withAlpha(header, 0.12)}, ${withAlpha(header, 0.2)})`,
                  }}
                />
              </div>

              <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-3 items-center gap-0.5">
                <div
                  className="h-3 w-4 origin-right -rotate-[25deg] rounded-full border"
                  style={{
                    background: `linear-gradient(135deg, ${header}, ${withAlpha(header, 0.85)})`,
                    borderColor: withAlpha(header, 0.5),
                  }}
                />
                <div
                  className="h-2.5 w-2.5 rounded-full shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${withAlpha(header, 0.85)}, ${header})`,
                    borderColor: withAlpha(header, 0.5),
                  }}
                />
                <div
                  className="h-3 w-4 origin-left rotate-[25deg] rounded-full border"
                  style={{
                    background: `linear-gradient(135deg, ${header}, ${withAlpha(header, 0.85)})`,
                    borderColor: withAlpha(header, 0.5),
                  }}
                />
              </div>

              <div className="relative rounded-xl p-4 pt-3" style={{ backgroundColor: theme.voucherCardBg || "#fff" }}>
                <div
                  className="absolute left-2 top-2 h-3 w-3 rounded-tl-md border-l-2 border-t-2"
                  style={{ borderColor: withAlpha(header, 0.6) }}
                />
                <div
                  className="absolute right-2 top-2 h-3 w-3 rounded-tr-md border-r-2 border-t-2"
                  style={{ borderColor: withAlpha(header, 0.6) }}
                />
                <div
                  className="absolute bottom-2 left-2 h-3 w-3 rounded-bl-md border-b-2 border-l-2"
                  style={{ borderColor: withAlpha(header, 0.6) }}
                />
                <div
                  className="absolute bottom-2 right-2 h-3 w-3 rounded-br-md border-b-2 border-r-2"
                  style={{ borderColor: withAlpha(header, 0.6) }}
                />

                {!imgSrc || imgError ? (
                  <div className="mx-auto max-w-[280px] rounded-lg border border-dashed border-slate-300 py-8 text-sm text-slate-500 dark:border-slate-600">
                    {theme.couponPageSubtext || "Add a barcode image in AI Studio."}
                  </div>
                ) : (
                  <img
                    src={imgSrc}
                    alt="Barcode"
                    className="mx-auto max-w-[280px]"
                    onError={() => setImgError(true)}
                  />
                )}
                <p className="mt-2 text-xs transition-colors group-hover:opacity-100" style={{ color: withAlpha(theme.voucherBodyText || "#64748b", 0.9) }}>
                  Tap to view fullscreen
                </p>
              </div>
            </div>
          </button>

          {isDiscountEnabled(theme) ? (
            <p className="mt-3 text-sm font-semibold" style={{ color: theme.voucherBodyText || "#334155" }}>
              🎁 <span style={{ color: header }}>{theme.discountPercent || "5%"} off</span>
            </p>
          ) : null}
        </div>

        <div
          className="rounded-xl border p-3 text-center"
          style={{
            backgroundColor: theme.voucherBodyBg || "#eff6ff",
            borderColor: withAlpha(theme.voucherBodyText || "#64748b", 0.25),
          }}
        >
          <p className="text-sm font-semibold" style={{ color: theme.voucherBodyText || "#334155" }}>
            {theme.voucherBody || "We hope you enjoy your visit."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            type="button"
            className="w-full rounded-full py-2.5 font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: theme.voucherPrimaryButtonBg || p,
              color: theme.voucherPrimaryButtonText || "#fff",
            }}
            onClick={onContinueChat}
          >
            Continue with the chat
          </button>
          <button
            type="button"
            className="w-full rounded-full py-2.5 font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: theme.voucherSecondaryButtonBg || "#0f172a",
              color: theme.voucherSecondaryButtonText || "#fff",
            }}
            onClick={onEndSession}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) return overlay;
  if (typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return null;
}
