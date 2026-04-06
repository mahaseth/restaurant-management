"use client";

import { useChatTheme } from "../utils/ThemeProvider";
import { surfaceBackgroundStyle } from "../utils/surfaceBackgroundStyle";

/**
 * Public guest chat: GPTA-style fade-out via `isTransitioning`.
 * Embedded (design tools): legacy full-bleed layout.
 */
export default function LoadingScreen({
  text,
  embedded = false,
  loading = true,
  isTransitioning = false,
  isMobile = false,
}) {
  const theme = useChatTheme();
  const p = theme.primaryColor || "#2563eb";
  const brandLine = [theme.brandName, theme.brandTagline].filter(Boolean).join(" · ");
  const lineW = embedded ? 140 : isMobile ? 140 : 180;
  const copy = text ?? theme.loadingText ?? "Preparing your dining guide";

  if (embedded) {
    return (
      <div
        className="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden font-sans antialiased"
        style={surfaceBackgroundStyle(theme.loadingBg)}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 px-8 text-center">
          {brandLine ? (
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] sm:mb-8 sm:text-sm" style={{ color: theme.loadingTextColor || "#cbd5e1" }}>
              {brandLine}
            </p>
          ) : (
            <p className="mb-6 rounded border border-dashed border-slate-600 px-2 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 sm:mb-8 sm:text-sm">
              Your brand name
            </p>
          )}
          <div className="relative inline-block animate-gpta-loading-line" style={{ width: lineW }}>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${theme.loadingGlowColor || p}, transparent)`,
                filter: "blur(6px)",
                opacity: 0.85,
              }}
            />
            <div className="h-0.5" style={{ background: `linear-gradient(to right, transparent, ${p}, transparent)` }} />
            <div
              className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-90"
              style={{ animation: "gpta-shimmer-load 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
            />
          </div>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest sm:mt-8 sm:text-base" style={{ color: theme.loadingTextColor || "#cbd5e1" }}>
            {copy}
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !isTransitioning) return null;

  const fadeDuration = isMobile ? 700 : 900;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundColor: theme.loadingBg || "#06080a",
        transitionDuration: `${fadeDuration}ms`,
        willChange: "opacity",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 px-8 text-center">
        {brandLine ? (
          <p
            className={`mb-6 text-xs font-semibold uppercase tracking-[0.28em] sm:mb-8 sm:text-sm ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
            style={{ transition: "opacity 0.4s ease", color: theme.loadingTextColor || "#cbd5e1" }}
          >
            {brandLine}
          </p>
        ) : (
          <p className="mb-6 rounded border border-dashed border-slate-600 px-2 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 sm:mb-8 sm:text-sm">
            Your brand name
          </p>
        )}

        <div className={`relative inline-block ${isTransitioning ? "" : "animate-gpta-loading-line"}`} style={{ width: lineW }}>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.loadingGlowColor || p}, transparent)`,
              filter: "blur(6px)",
              opacity: 0.85,
            }}
          />
          <div className="h-0.5" style={{ background: `linear-gradient(to right, transparent, ${p}, transparent)` }} />
          <div
            className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-90"
            style={{ animation: "gpta-shimmer-load 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          />
        </div>

        <p
          className={`mt-6 text-sm font-medium uppercase tracking-widest sm:mt-8 sm:text-base ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
          style={{
            color: theme.loadingTextColor || "#cbd5e1",
            transition: `opacity ${fadeDuration * 0.3}ms ease ${isMobile ? 400 : 600}ms`,
          }}
        >
          {copy}
        </p>
      </div>
    </div>
  );
}
