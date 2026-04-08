"use client";

import { useState, useEffect, useCallback } from "react";
import { hexAlpha } from "../utils/brandingPalette";

function formatPrice(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/** Match backend normalizeMenuImageUrl — Cloudinary / Supabase / protocol-relative. */
function displayImageSrc(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  return s;
}

/**
 * Dish recommendation strip (GPTA-style): thumbnail, name, price, tap to expand image.
 */
export default function MenuRecommendationCards({ items, theme, embedded = false }) {
  const [expandedUrl, setExpandedUrl] = useState(null);
  const p = theme?.primaryColor || "#2563eb";
  const openImage = useCallback((url) => {
    if (!url) return;
    setExpandedUrl(url);
  }, []);

  const onKey = useCallback((e) => {
    if (e.key === "Escape") setExpandedUrl(null);
  }, []);

  useEffect(() => {
    if (!expandedUrl) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedUrl, onKey]);

  if (!items?.length) return null;

  return (
    <>
      <div
        className={
          embedded
            ? "flex w-full gap-2.5 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "grid w-full grid-cols-1 gap-3 pt-1 sm:grid-cols-2"
        }
      >
        {items.map((it) => {
          const src = displayImageSrc(it.imageUrl);
          return (
          <article
            key={`${it.menuItemId || it.name}-${it.name}`}
            className={
              embedded
                ? "flex min-w-[min(260px,88vw)] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-black/8 bg-white/95 shadow-md ring-1 ring-black/[0.04] dark:border-white/10 dark:bg-slate-900/95"
                : "flex min-w-0 overflow-hidden rounded-2xl border border-black/8 bg-white/95 shadow-md ring-1 ring-black/[0.06] dark:border-white/10 dark:bg-slate-900/95"
            }
            style={{ boxShadow: `0 8px 28px -12px ${hexAlpha(p, 0.22)}` }}
          >
            {src ? (
              <button
                type="button"
                className="group relative h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden sm:h-[6rem] sm:w-[6rem]"
                onClick={() => openImage(src)}
                onPointerUp={() => openImage(src)}
                aria-label={`View ${it.name} full size`}
              >
                <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition-colors group-hover:bg-black/55">
                  <i className="pi pi-expand text-sm" />
                </span>
              </button>
            ) : (
              <div
                className="flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center bg-slate-100 dark:bg-slate-800 sm:h-[6rem] sm:w-[6rem]"
                aria-hidden
              >
                <i className="pi pi-image text-2xl text-slate-300 dark:text-slate-600" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
              <p className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">{it.name}</p>
              {it.price != null && it.price !== "" ? (
                <p className="text-sm font-medium tabular-nums" style={{ color: p }}>
                  ${formatPrice(Number(it.price))}
                </p>
              ) : null}
              {src ? (
                <button
                  type="button"
                  className="mt-1 w-fit rounded-full border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => openImage(src)}
                  onPointerUp={() => openImage(src)}
                >
                  Expand image
                </button>
              ) : (
                <span className="mt-1 text-xs text-slate-400">No image available</span>
              )}
            </div>
          </article>
          );
        })}
      </div>

      {expandedUrl ? (
        <div
          className="fixed inset-0 z-[130] flex cursor-zoom-out items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded dish image"
          onClick={() => setExpandedUrl(null)}
        >
          <img
            src={expandedUrl}
            alt=""
            className="max-h-[min(90vh,900px)] max-w-full cursor-default rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
