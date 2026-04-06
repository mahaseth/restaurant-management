"use client";

import { useChatTheme } from "../utils/ThemeProvider";
import { surfaceBackgroundStyle } from "../utils/surfaceBackgroundStyle";

/**
 * Ported from GPTA `WelcomeScreen.tsx` — brand line, avatar / initial, name, accent line,
 * heading, subtext, "Entering chat". No frosted card; same vignettes + radial glow as GPTA.
 */
export default function WelcomeScreen({
  fading,
  heading,
  subtext,
  embedded = false,
  agentName = "",
  avatarUrl = null,
  /** GPTA: shorter fade on narrow viewports */
  isMobile = false,
}) {
  const theme = useChatTheme();
  const p = theme.primaryColor || "#2563eb";
  const brandLine = [theme.brandName, theme.brandTagline].filter(Boolean).join(" · ");
  const displayName = agentName || "Your Assistant";
  const initial = (displayName || "A").charAt(0).toUpperCase();
  const lineW = embedded ? 100 : 130;
  const fadeMs = embedded ? 700 : isMobile ? 600 : 800;

  const h = heading ?? theme.welcomeHeading;
  const st = subtext ?? theme.welcomeSubtext;

  const shell = embedded
    ? `relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden font-sans antialiased ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        fading ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"
      }`
    : `fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden font-sans antialiased ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        fading ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"
      }`;

  const welcomeSurface = surfaceBackgroundStyle(theme.welcomeBg);

  return (
    <div
      className={shell}
      style={{
        ...welcomeSurface,
        transitionProperty: "opacity, transform",
        transitionDuration: `${fadeMs}ms`,
        willChange: "opacity, transform",
      }}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-black/60 to-transparent" />

      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
          fading ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: `radial-gradient(circle, ${p}14 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-6 text-center sm:px-8">
        {brandLine ? (
          <p
            className="mb-8 text-xs font-semibold uppercase tracking-[0.28em] sm:mb-10 sm:text-sm"
            style={{ color: theme.welcomeTextColor || "#f8fafc" }}
          >
            {brandLine}
          </p>
        ) : (
          <p className="mb-8 rounded border border-dashed border-slate-600 px-2 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 sm:mb-10 sm:text-sm">
            Your brand name
          </p>
        )}

        <div className={`mb-6 sm:mb-7 ${fading ? "opacity-0" : ""}`}>
          {avatarUrl ? (
            <div className="relative">
              <div
                className="h-20 w-20 overflow-hidden rounded-full border-2 shadow-lg ring-1 ring-white/10 sm:h-24 sm:w-24"
                style={{ borderColor: `${p}80`, boxShadow: `0 10px 15px -3px ${p}33` }}
              >
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              </div>
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[#06080a] bg-emerald-400" />
            </div>
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg sm:h-24 sm:w-24"
              style={{
                background: `linear-gradient(135deg, ${p}33, ${p}1a)`,
                borderColor: `${p}66`,
                boxShadow: `0 10px 15px -3px ${p}26`,
              }}
            >
              <span className="text-3xl font-bold tracking-tighter sm:text-4xl" style={{ color: `${p}cc` }}>
                {initial}
              </span>
            </div>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{displayName}</h1>

        <div className="relative mb-6 inline-block sm:mb-7" style={{ width: lineW }}>
          <div className="h-0.5" style={{ background: `linear-gradient(to right, transparent, ${p}, transparent)` }} />
        </div>

        <p
          className="max-w-sm text-base font-normal leading-relaxed sm:text-lg"
          style={{ color: theme.welcomeTextColor || "#f8fafc" }}
        >
          {h}
        </p>

        {st ? (
          <p className="mt-2 max-w-sm text-sm" style={{ color: theme.welcomeSubtextColor || "#94a3b8" }}>
            {st}
          </p>
        ) : null}

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:mt-10 sm:text-sm">
          Entering chat
        </p>
      </div>
    </div>
  );
}
