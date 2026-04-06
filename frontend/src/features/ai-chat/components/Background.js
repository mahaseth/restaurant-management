"use client";

import { useChatTheme } from "../utils/ThemeProvider";
import { hexAlpha } from "../utils/brandingPalette";

export default function Background({ chatReady, backgroundImageUrl, embedded = false }) {
  const theme = useChatTheme();
  const hasImage = !!backgroundImageUrl;
  const sharp = Math.max(0, Math.min(100, Number(theme.backgroundSharpness ?? 100)));
  const blurPx = Number((((100 - sharp) / 100) * 6).toFixed(2));
  const primary = theme.primaryColor || "#2563eb";

  const ambient =
    chatReady && !hasImage
      ? `radial-gradient(ellipse 120% 80% at 50% -10%, ${hexAlpha(primary, 0.18)} 0%, transparent 55%),
         linear-gradient(180deg, ${theme.pageBgFlat || "#f1f5f9"} 0%, #e8edf3 100%)`
      : undefined;

  return (
    <div className={embedded ? "absolute inset-0 -z-10" : "fixed inset-0 -z-10"} aria-hidden>
      {!chatReady && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: theme.loadingBg || "linear-gradient(to bottom, #06080a 0%, #0a0d12 100%)",
          }}
        />
      )}
      {chatReady && !hasImage && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: ambient }}
          />
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full blur-[140px]"
              style={{ backgroundColor: `${primary}1a` }}
            />
            <div
              className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full blur-[120px]"
              style={{ backgroundColor: `${primary}14` }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
              style={{ backgroundColor: `${primary}0d` }}
            />
          </div>
        </>
      )}
      {chatReady && hasImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
            transform: blurPx > 0 ? "scale(1.03)" : undefined,
          }}
        >
          {/* GPTA: light overlay so chat stays readable; not a heavy gradient wash */}
          <div className="absolute inset-0 bg-black/15" />
        </div>
      )}
    </div>
  );
}
