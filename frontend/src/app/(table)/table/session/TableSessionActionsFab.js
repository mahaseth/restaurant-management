"use client";

/**
 * Floating cart control inside the chat area: opens the cart + menu drawer.
 */
export default function TableSessionActionsFab({ cartCount, onOpenCart }) {
  return (
    <div className="pointer-events-auto absolute bottom-[4.75rem] right-2 z-20 sm:bottom-24 sm:right-3">
      <div className="relative">
        {cartCount > 0 ? (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-[1] flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-800 shadow-xl shadow-slate-900/15 ring-1 ring-slate-200/80 transition active:scale-95 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
          onClick={onOpenCart}
          aria-label={cartCount ? `Open cart and menu, ${cartCount} items in cart` : "Open cart and menu"}
        >
          <i className="text-xl pi pi-shopping-cart" />
        </button>
      </div>
    </div>
  );
}
