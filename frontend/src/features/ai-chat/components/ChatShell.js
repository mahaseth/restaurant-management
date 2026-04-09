"use client";

import { useChatTheme } from "../utils/ThemeProvider";
import ThinkingDots from "./ThinkingDots";
import MenuRecommendationCards from "./MenuRecommendationCards";
import { hexAlpha } from "../utils/brandingPalette";

/** Renders `**bold**` as styled text (avoids raw asterisks in the UI). */
function LineWithBold({ text }) {
  const parts = [];
  let key = 0;
  let last = 0;
  const re = /\*\*(.+?)\*\*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    }
    parts.push(
      <strong key={key++} className="font-semibold">
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return parts.length ? parts : text;
}

function normalizeAssistantLine(line) {
  let t = String(line || "");
  // Remove visual junk often produced by LLM formatting.
  t = t.replace(/^\s*\|\s*/, "");
  t = t.replace(/^\s{2,}/, " ");
  return t.trimEnd();
}

function lineKind(line) {
  const t = line.trim();
  if (!t) return "blank";
  if (/^\d+[\.\)]\s+/.test(t)) return "ordered";
  if (/^[-•]\s+/.test(t)) return "bullet";
  return "text";
}

function MessageBubble({ m, theme, p, embedded, onAddRecommendationToCart }) {
  const menuCards =
    !m.isFromUser && Array.isArray(m.menuRecommendations) && m.menuRecommendations.length > 0
      ? m.menuRecommendations
      : null;
  const hasText = Boolean((m.content || "").trim());
  const renderedLines = (m.content || "")
    .split("\n")
    .map((line) => (m.isFromUser ? line : normalizeAssistantLine(line)));

  return (
    <div className={`flex w-full flex-col gap-1.5 ${m.isFromUser ? "items-end" : "items-start"}`}>
      {hasText ? (
        <div
          className={`max-w-[88%] shadow-sm sm:max-w-[85%] ${
            embedded
              ? `rounded-xl px-3 py-2.5 text-[15px] leading-normal ${
                  m.isFromUser ? "rounded-br-sm shadow-md font-medium" : "rounded-bl-sm ring-1 ring-slate-200/80 font-medium"
                }`
              : `rounded-[1.15rem] px-4 py-3 text-[15px] sm:text-base leading-relaxed ${
                  m.isFromUser ? "rounded-br-md shadow-md" : "rounded-bl-md ring-1 ring-slate-200/80"
                }`
          }`}
          style={{
            background: m.isFromUser ? theme.userBubbleBg || p : theme.botBubbleBg || "#f1f5f9",
            color: m.isFromUser ? theme.userBubbleText || "#fff" : theme.botBubbleText || "#1e293b",
            boxShadow: m.isFromUser ? `0 8px 24px -8px ${hexAlpha(p, 0.45)}` : undefined,
          }}
        >
          {renderedLines.map((line, i) => {
            const kind = lineKind(line);
            if (kind === "blank") return <div key={i} className="h-1" />;
            return (
              <p
                key={i}
                className={
                  i
                    ? kind === "ordered" || kind === "bullet"
                      ? "mt-1.5 rounded-md bg-black/[0.03] px-2.5 py-1 dark:bg-white/[0.05]"
                      : "mt-2"
                    : kind === "ordered" || kind === "bullet"
                      ? "rounded-md bg-black/[0.03] px-2.5 py-1 dark:bg-white/[0.05]"
                    : ""
                }
              >
                <LineWithBold text={line} />
              </p>
            );
          })}
        </div>
      ) : null}
      {menuCards ? (
        <div
          className={embedded ? "w-full max-w-[95%]" : "w-full max-w-[88%] sm:max-w-[85%]"}
          data-menu-recs={onAddRecommendationToCart ? "1" : undefined}
        >
          <MenuRecommendationCards
            items={menuCards}
            theme={theme}
            embedded={embedded}
            onAddToCart={onAddRecommendationToCart}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ChatShell({
  agentName,
  avatarUrl,
  messages,
  thinking,
  thinkingText,
  messageInput,
  setMessageInput,
  onSend,
  sending,
  endChatLabel,
  onEndChat,
  messagesContainerRef,
  discountBanner,
  embedded = false,
  /** Design-studio preview: show blurred background inside the phone (sibling Background is covered by opaque message area). */
  backgroundImageUrl = null,
  /** When set, recommendation cards show an "Add to cart" control (table session). */
  onAddRecommendationToCart = null,
  /** Disable typing/sending (e.g. AI off for this venue). */
  composerDisabled = false,
}) {
  const theme = useChatTheme();
  const p = theme.primaryColor || "#2563eb";
  const sharp = Math.max(0, Math.min(100, Number(theme.backgroundSharpness ?? 100)));
  const blurPx = ((100 - sharp) / 100) * 8;
  const showEmbeddedBg = embedded && !!backgroundImageUrl;

  /** GPTA-style: full viewport width, content column max-w-3xl — not a narrow phone card. */
  if (!embedded) {
    return (
      <div className="relative z-10 flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden font-sans antialiased leading-relaxed">
        <header
          className="shrink-0 border-b border-black/10 backdrop-blur-md"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top))",
            background: theme.headerBg || "rgba(255,255,255,0.92)",
            color: theme.headerText || "#0f172a",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white sm:h-12 sm:w-12" />
              ) : (
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md ring-2 ring-white sm:h-12 sm:w-12"
                  style={{ background: `linear-gradient(145deg, ${p} 0%, ${hexAlpha(p, 0.75)} 100%)` }}
                >
                  <i className="pi pi-comments text-lg text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight sm:text-lg">{agentName}</p>
                {theme.brandTagline ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{theme.brandTagline}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl border border-slate-200/90 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white sm:text-sm"
              onClick={onEndChat}
            >
              {endChatLabel || "End Chat"}
            </button>
          </div>
        </header>

        {discountBanner ? (
          <div
            className="shrink-0 text-center text-xs font-semibold tracking-wide sm:text-sm"
            style={{
              background: theme.voucherBannerBg || "#f59e0b",
              color: theme.voucherBannerText || "#fff",
            }}
          >
            <div className="mx-auto max-w-3xl px-4 py-2.5">{discountBanner}</div>
          </div>
        ) : null}

        <div
          ref={messagesContainerRef}
          className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth"
          style={{
            WebkitOverflowScrolling: "touch",
            background: "transparent",
          }}
        >
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
            {messages.map((m) => (
              <MessageBubble
                key={m.messageId}
                m={m}
                theme={theme}
                p={p}
                embedded={false}
                onAddRecommendationToCart={onAddRecommendationToCart}
              />
            ))}
            {thinking ? (
              <div className="flex justify-start">
                <div
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm italic ring-1 ring-slate-200/80 shadow-sm"
                  style={{
                    background: theme.botBubbleBg || "#f1f5f9",
                    color: theme.botBubbleText || "#475569",
                  }}
                >
                  <ThinkingDots />
                  <span>{thinkingText}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={onSend}
          className="shrink-0 border-t border-slate-200/80"
          style={{
            background: theme.composerBg || "rgba(255,255,255,0.96)",
            paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
            boxShadow: "0 -12px 40px -20px rgba(15,23,42,0.08)",
          }}
        >
          <div className="mx-auto max-w-3xl px-4 py-2.5 sm:px-5">
            <div
              className="flex items-end gap-2 rounded-2xl bg-slate-50/95 p-1.5 pl-3 ring-1 ring-slate-200/80 focus-within:ring-2 focus-within:ring-offset-0"
              style={{ ["--chat-ring"]: hexAlpha(p, 0.38) }}
            >
              <textarea
                rows={1}
                className="min-h-[48px] max-h-[120px] min-w-0 flex-1 resize-none rounded-xl border-0 bg-transparent px-1 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
                placeholder="Ask about the menu, prices, or diets…"
                title="Ask about the menu, prices, or dietary options."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend(e);
                  }
                }}
                disabled={sending || composerDisabled}
                style={{ color: "#0f172a", overflowY: "auto" }}
              />
              <button
                type="submit"
                disabled={sending || composerDisabled || !messageInput.trim()}
                className="flex min-h-[44px] min-w-[88px] shrink-0 items-center justify-center rounded-xl px-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[96px]"
                style={{
                  background: `linear-gradient(180deg, ${hexAlpha(p, 1)} 0%, ${hexAlpha(p, 0.88)} 100%)`,
                  boxShadow: `0 4px 14px -4px ${hexAlpha(p, 0.55)}`,
                }}
              >
                <span className="hidden sm:inline">Send</span>
                <i className="pi pi-send sm:ml-1 sm:hidden" />
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ——— Design studio embedded preview (unchanged structure) ——— */
  return (
    <div className="relative z-10 flex h-full min-h-0 w-full flex-col px-0 py-0 text-[16px] font-sans antialiased leading-relaxed tracking-normal">
      <div className="relative flex h-full min-h-0 max-h-full w-full max-w-none flex-col overflow-hidden rounded-[1.15rem] ring-1 ring-black/[0.08]">
        {showEmbeddedBg && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
                transform: blurPx > 0 ? "scale(1.04)" : undefined,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/45" />
          </div>
        )}

        <header
          className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-black/[0.06] px-3 py-3 backdrop-blur-xl"
          style={{
            background: theme.headerBg || "rgba(255,255,255,0.88)",
            color: theme.headerText || "#0f172a",
            boxShadow: "0 8px 32px -12px rgba(15,23,42,0.12)",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-11 w-11 rounded-2xl object-cover shadow-md ring-2 ring-white" />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md ring-2 ring-white"
                style={{ background: `linear-gradient(145deg, ${p} 0%, ${hexAlpha(p, 0.75)} 100%)` }}
              >
                <i className="pi pi-comments text-lg text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">{agentName}</p>
              {theme.brandTagline && (
                <p className="mt-0.5 truncate text-[14px] leading-snug text-slate-500">{theme.brandTagline}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-slate-200/90 bg-white/60 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white"
            onClick={onEndChat}
          >
            {endChatLabel || "End Chat"}
          </button>
        </header>

        {discountBanner && (
          <div
            className="relative z-10 shrink-0 px-2 py-1.5 text-center text-[13px] font-semibold tracking-wide"
            style={{
              background: theme.voucherBannerBg || "#f59e0b",
              color: theme.voucherBannerText || "#fff",
            }}
          >
            {discountBanner}
          </div>
        )}

        <div
          ref={messagesContainerRef}
          className="relative z-10 min-h-0 flex-1 space-y-1.5 overflow-hidden overscroll-none px-3 py-2"
          style={{
            background: showEmbeddedBg ? "transparent" : theme.pageBg || theme.pageBgFlat || "#f1f5f9",
            boxShadow: `inset 0 1px 0 ${hexAlpha(p, 0.06)}`,
          }}
        >
          {messages.map((m) => (
            <MessageBubble
              key={m.messageId}
              m={m}
              theme={theme}
              p={p}
              embedded
              onAddRecommendationToCart={onAddRecommendationToCart}
            />
          ))}
          {thinking && (
            <div className="flex items-center justify-start gap-2">
              <div
                className="inline-flex items-center gap-2 rounded-lg rounded-bl-md px-2.5 py-1.5 text-[13px] italic ring-1 ring-slate-200/80 shadow-sm"
                style={{
                  background: theme.botBubbleBg || "#f1f5f9",
                  color: theme.botBubbleText || "#475569",
                }}
              >
                <ThinkingDots />
                <span>{thinkingText}</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={onSend}
          className="relative z-10 shrink-0 border-t border-slate-200/70 p-2.5"
          style={{
            background: theme.composerBg || "rgba(255,255,255,0.96)",
            boxShadow: "0 -12px 40px -20px rgba(15,23,42,0.12)",
          }}
        >
          <div
            className="flex items-end gap-2 rounded-2xl bg-slate-50/90 p-1.5 pl-2 ring-1 ring-slate-200/80 transition-shadow focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-[color:var(--chat-ring)]"
            style={{ ["--chat-ring"]: hexAlpha(p, 0.38) }}
          >
            <input
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border-0 bg-transparent px-2.5 py-2 text-[15px] placeholder:text-slate-500 focus:outline-none focus:ring-0"
              placeholder="Ask about the menu, prices, or diets…"
              title="Ask about the menu, prices, or dietary options."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending || embedded || composerDisabled}
              readOnly={embedded || composerDisabled}
              style={{ color: "#0f172a" }}
            />
            <button
              type="submit"
              disabled={sending || embedded || composerDisabled}
              className="flex min-h-[40px] min-w-[64px] shrink-0 items-center justify-center rounded-xl px-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: `linear-gradient(180deg, ${hexAlpha(p, 1)} 0%, ${hexAlpha(p, 0.88)} 100%)`,
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
