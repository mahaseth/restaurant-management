"use client";

import { useState, useEffect, useCallback } from "react";
import { hexAlpha } from "../utils/brandingPalette";
import { formatMoney } from "@/utils/formatMoney";

function LineWithBold({ text }) {
  const parts = [];
  let key = 0;
  let last = 0;
  const re = /\*\*(.+?)\*\*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    parts.push(
      <strong key={key++} className="font-semibold text-slate-700 dark:text-slate-200">
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts.length ? parts : text;
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

const cardBase =
  "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white/95 shadow-md ring-1 dark:border-white/10 dark:bg-slate-900/95";

const cardRingEmbed = "ring-black/[0.04]";
const cardRingDefault = "ring-black/[0.06]";

export function ImageLightbox({ url, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-[130] flex cursor-zoom-out items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded dish image"
      onClick={onClose}
    >
      <img
        src={url}
        alt=""
        className="max-h-[min(90vh,900px)] max-w-full cursor-default rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function CompactDishThumb({ src, name, onOpenImage, inBubble = false }) {
  const size = inBubble ? "h-14 w-14 sm:h-16 sm:w-16" : "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20";
  if (src) {
    return (
      <button
        type="button"
        className={`group relative shrink-0 overflow-hidden rounded-xl ring-1 ring-black/[0.08] ${size}`}
        onClick={() => onOpenImage?.(src)}
        aria-label={`View ${name} full size`}
      >
        <img
          src={src}
          alt=""
          className="h-full w-full bg-slate-200 object-cover object-center dark:bg-slate-800"
          loading="lazy"
        />
        <span className="pointer-events-none absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20">
          <i className="pi pi-expand text-[9px]" />
        </span>
      </button>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${size}`}
      aria-hidden
    >
      <i className="pi pi-image text-xl text-slate-300 dark:text-slate-600" />
    </div>
  );
}

function DishNumberBadge({ number, color }) {
  return (
    <span
      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
      style={{ background: color }}
    >
      {number}
    </span>
  );
}

/** Single dish card — used inline under each recommendation line. */
export function MenuRecommendationCard({
  item,
  theme,
  embedded = false,
  onAddToCart = null,
  onOpenImage = null,
  /** compact: horizontal row for inline chat pairs under bullets */
  compact = false,
  /** inBubble: nested inside assistant message — softer, no heavy shadow */
  inBubble = false,
  /** Shown inside unified in-bubble tile above the image row */
  description = null,
  badgeNumber = null,
}) {
  const p = theme?.primaryColor || "#2563eb";
  const src = displayImageSrc(item?.imageUrl);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (typeof onAddToCart !== "function" || !item.menuItemId) return;
    onAddToCart(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  if (compact) {
    if (inBubble) {
      return (
        <article
          className="group/card w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06] transition hover:ring-black/[0.1] dark:bg-white/[0.12] dark:ring-white/10"
          style={{ boxShadow: `0 1px 8px -4px ${hexAlpha(p, 0.2)}` }}
        >
          {description ? (
            <div
              className="flex items-start gap-2 border-b px-3 py-2.5 sm:px-3.5"
              style={{ borderColor: hexAlpha(p, 0.1), background: hexAlpha(p, 0.04) }}
            >
              {badgeNumber ? <DishNumberBadge number={badgeNumber} color={p} /> : null}
              <p className="min-w-0 flex-1 text-[13px] leading-[1.55] text-slate-700 dark:text-slate-200 sm:text-[14px]">
                <LineWithBold text={description} />
              </p>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
            <CompactDishThumb src={src} name={item.name} onOpenImage={onOpenImage} inBubble />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-sm">
                {item.name}
              </p>
              {item.price != null && item.price !== "" ? (
                <p className="mt-0.5 text-xs font-bold tabular-nums sm:text-[13px]" style={{ color: p }}>
                  {formatMoney(item.price)}
                </p>
              ) : null}
            </div>
            {typeof onAddToCart === "function" && item.menuItemId ? (
              <button
                type="button"
                className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-[11px] font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95 sm:h-10 sm:px-3.5 sm:text-xs ${added ? "chat-add-pop" : ""}`}
                style={{
                  background: added ? "#16a34a" : p,
                  boxShadow: added ? "0 4px 14px -6px rgba(22,163,74,0.45)" : `0 4px 14px -6px ${hexAlpha(p, 0.5)}`,
                }}
                onClick={handleAdd}
                aria-label={added ? `${item.name} added` : `Add ${item.name} to cart`}
              >
                <i className={`text-[10px] sm:text-xs ${added ? "pi pi-check" : "pi pi-plus"}`} />
                <span className="hidden min-[380px]:inline">{added ? "Added" : "Add"}</span>
              </button>
            ) : null}
          </div>
        </article>
      );
    }

    return (
      <article
        className={`group/card flex w-full items-center gap-2.5 overflow-hidden rounded-xl border border-black/8 bg-white/95 p-2 shadow-sm ring-1 ring-black/[0.05] dark:border-white/10 dark:bg-slate-900/95 sm:p-2.5 ${embedded ? cardRingEmbed : cardRingDefault}`}
        style={{ boxShadow: `0 4px 16px -10px ${hexAlpha(p, 0.18)}` }}
      >
        <CompactDishThumb src={src} name={item.name} onOpenImage={onOpenImage} inBubble={false} />
        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-sm">
            {item.name}
          </p>
          {item.price != null && item.price !== "" ? (
            <p className="mt-0.5 text-xs font-bold tabular-nums sm:text-[13px]" style={{ color: p }}>
              {formatMoney(item.price)}
            </p>
          ) : null}
        </div>
        {typeof onAddToCart === "function" && item.menuItemId ? (
          <button
            type="button"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:brightness-110 active:scale-95 sm:h-10 sm:w-10 ${added ? "chat-add-pop" : ""}`}
            style={{
              background: added ? "#16a34a" : p,
              boxShadow: added ? "0 4px 14px -6px rgba(22,163,74,0.45)" : `0 4px 14px -6px ${hexAlpha(p, 0.55)}`,
            }}
            onClick={handleAdd}
            aria-label={added ? `${item.name} added` : `Add ${item.name} to cart`}
            title="Add to cart"
          >
            <i className={`text-sm font-bold ${added ? "pi pi-check" : "pi pi-plus"}`} />
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={
        embedded
          ? `${cardBase} min-w-[min(280px,88vw)] max-w-[300px] shrink-0 ${cardRingEmbed}`
          : `${cardBase} w-full ${cardRingDefault}`
      }
      style={{ boxShadow: `0 8px 28px -12px ${hexAlpha(p, 0.22)}` }}
    >
      {src ? (
        <button
          type="button"
          className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden"
          onClick={() => onOpenImage?.(src)}
          onPointerUp={() => onOpenImage?.(src)}
          aria-label={`View ${item.name} full size`}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full bg-slate-200 object-cover object-center dark:bg-slate-800"
            loading="lazy"
          />
          <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/20 backdrop-blur-sm transition-colors group-hover:bg-black/55">
            <i className="pi pi-expand text-sm" />
          </span>
        </button>
      ) : (
        <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center bg-slate-100 dark:bg-slate-800" aria-hidden>
          <i className="pi pi-image text-3xl text-slate-300 dark:text-slate-600" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3.5 py-3">
        <p className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {item.name}
        </p>
        {item.price != null && item.price !== "" ? (
          <p className="text-sm font-medium tabular-nums" style={{ color: p }}>
            {formatMoney(item.price)}
          </p>
        ) : null}
        {!src ? <span className="text-xs text-slate-400">No image available</span> : null}
        {typeof onAddToCart === "function" && item.menuItemId ? (
          <button
            type="button"
            className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] ${added ? "chat-add-pop" : ""}`}
            style={{
              background: added ? "#16a34a" : p,
              boxShadow: added ? "0 4px 14px -6px rgba(22,163,74,0.45)" : undefined,
            }}
            onClick={handleAdd}
            aria-label={added ? `${item.name} added` : `Add ${item.name} to cart`}
          >
            <i className={`text-xs ${added ? "pi pi-check" : "pi pi-plus"}`} />
            {added ? "Added" : "Add to cart"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Dish recommendations: large image on top (full card width), details + actions below.
 * Tapping the photo opens the lightbox (expand icon is the only extra affordance; no duplicate text link).
 */
export default function MenuRecommendationCards({ items, theme, embedded = false, onAddToCart = null, layout = "grid" }) {
  const [expandedUrl, setExpandedUrl] = useState(null);
  const openImage = useCallback((url) => {
    if (!url) return;
    setExpandedUrl(url);
  }, []);

  if (!items?.length) return null;

  const isStack = layout === "stack";

  return (
    <>
      <div
        className={
          embedded
            ? "flex w-full gap-2.5 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : isStack
              ? "flex w-full flex-col gap-3 pt-1"
              : "grid w-full grid-cols-1 gap-3 pt-1 sm:grid-cols-2"
        }
      >
        {items.map((it) => (
          <MenuRecommendationCard
            key={`${it.menuItemId || it.name}-${it.name}`}
            item={it}
            theme={theme}
            embedded={embedded}
            onAddToCart={onAddToCart}
            onOpenImage={openImage}
            compact={isStack && !embedded}
            inBubble={isStack && !embedded}
          />
        ))}
      </div>

      <ImageLightbox url={expandedUrl} onClose={() => setExpandedUrl(null)} />
    </>
  );
}
