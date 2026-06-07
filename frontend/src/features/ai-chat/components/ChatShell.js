"use client";

import { useState } from "react";
import { useChatTheme } from "../utils/ThemeProvider";
import ThinkingDots from "./ThinkingDots";
import { MenuRecommendationCard, ImageLightbox } from "./MenuRecommendationCards";
import { buildInterleavedMessageSegments, lineKind, parseDishLine } from "../utils/interleaveMessageRecommendations";
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

function bubbleShellClass({ embedded, isFromUser }) {
  if (embedded) {
    return isFromUser
      ? "rounded-xl rounded-br-sm px-3 py-2.5 text-[15px] leading-normal shadow-md font-medium"
      : "rounded-xl rounded-bl-sm px-3 py-2.5 text-[15px] leading-normal font-medium ring-1 ring-slate-200/80";
  }
  return isFromUser
    ? "rounded-[1.15rem] rounded-br-md px-4 py-3 text-[15px] sm:text-base leading-relaxed shadow-md"
    : "rounded-[1.15rem] rounded-bl-md px-4 py-3 text-[15px] sm:text-base leading-relaxed ring-1 ring-slate-200/80";
}

function TextLines({ lines, inBubble = false, lineClassName = "" }) {
  return lines.map((line, i) => {
    const kind = lineKind(line);
    if (kind === "blank") return <div key={i} className="h-1.5" />;
    const isList = kind === "ordered" || kind === "bullet";
    return (
      <p
        key={i}
        className={
          lineClassName ||
          (inBubble
            ? i
              ? isList
                ? "mt-2 text-[14px] leading-relaxed sm:text-[15px]"
                : "mt-2.5 text-[14px] leading-relaxed sm:text-[15px]"
              : "text-[14px] leading-relaxed sm:text-[15px]"
            : i
              ? isList
                ? "mt-1.5 rounded-md bg-black/[0.03] px-2.5 py-1 dark:bg-white/[0.05]"
                : "mt-2"
              : isList
                ? "rounded-md bg-black/[0.03] px-2.5 py-1 dark:bg-white/[0.05]"
                : "")
        }
      >
        <LineWithBold text={line} />
      </p>
    );
  });
}

function BotAvatar({ avatarUrl, color }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/80 shadow-sm sm:h-9 sm:w-9"
      />
    );
  }
  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-white/80 sm:h-9 sm:w-9"
      style={{ background: `linear-gradient(145deg, ${color} 0%, ${hexAlpha(color, 0.72)} 100%)` }}
      aria-hidden
    >
      <i className="pi pi-sparkles text-xs text-white sm:text-sm" />
    </div>
  );
}

function MenuPicksLabel({ color }) {
  return (
    <div
      className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:mb-2 sm:text-[11px]"
      style={{ color, background: hexAlpha(color, 0.12) }}
    >
      <i className="pi pi-star-fill text-[9px] sm:text-[10px]" />
      <span>Suggested for you</span>
    </div>
  );
}

function QuickReplyChips({ replies, primary, onSelect, disabled }) {
  if (!Array.isArray(replies) || !replies.length || typeof onSelect !== "function") return null;
  return (
    <div className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
        Quick replies
      </p>
      <div className="flex flex-wrap gap-2">
        {replies.map((qr, i) => (
          <button
            key={`${qr.label}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(qr.prompt || qr.label)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition hover:-translate-y-px hover:shadow-sm active:scale-[0.98] disabled:opacity-50 sm:text-[13px]"
            style={{
              borderColor: hexAlpha(primary, 0.25),
              color: primary,
              background: hexAlpha(primary, 0.07),
            }}
          >
            <i className="pi pi-comment text-[10px] opacity-70" />
            {qr.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GuestAvatar({ color }) {
  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 ring-2 ring-white/90 shadow-sm sm:h-9 sm:w-9"
      style={{ color }}
      aria-hidden
    >
      <i className="pi pi-user text-xs sm:text-sm" />
    </div>
  );
}

function splitAssistantSegments(segments) {
  const menuIdxs = segments
    .map((s, i) => (s.type === "dish" || s.type === "cards" ? i : -1))
    .filter((i) => i >= 0);
  if (!menuIdxs.length) {
    return { intro: segments.filter((s) => s.type === "text"), menu: [], outro: [] };
  }
  const first = menuIdxs[0];
  const last = menuIdxs[menuIdxs.length - 1];
  return {
    intro: segments.slice(0, first).filter((s) => s.type === "text"),
    menu: segments.slice(first, last + 1).filter((s) => s.type === "dish" || s.type === "cards"),
    outro: segments.slice(last + 1).filter((s) => s.type === "text"),
  };
}

function DishListPanel({ children, primary }) {
  return (
    <div
      className="mt-3 flex flex-col gap-2 rounded-2xl p-2 ring-1 ring-inset sm:gap-2.5 sm:p-2.5"
      style={{
        background: `linear-gradient(180deg, ${hexAlpha(primary, 0.06)} 0%, ${hexAlpha(primary, 0.02)} 100%)`,
        boxShadow: `inset 0 1px 0 ${hexAlpha(primary, 0.08)}`,
        ["--tw-ring-color"]: hexAlpha(primary, 0.12),
      }}
    >
      {children}
    </div>
  );
}

function DishBlock({
  seg,
  dishIndex,
  theme,
  embedded,
  primary,
  onAddRecommendationToCart,
  onOpenImage,
  showMenuLabel,
  spacedTop = false,
}) {
  const parsed = parseDishLine(seg.line);
  const badgeNum = parsed.number || String(dishIndex);
  const blurb = parsed.description || (parsed.title ? null : seg.line.replace(/^\d+[\.\)]\s+/, "").replace(/^[-•]\s+/, ""));

  return (
    <div className={spacedTop ? "mt-2.5" : ""}>
      {showMenuLabel ? <MenuPicksLabel color={primary} /> : null}
      <MenuRecommendationCard
        item={seg.item}
        theme={theme}
        embedded={embedded}
        compact
        inBubble
        description={blurb}
        badgeNumber={blurb ? badgeNum : null}
        onAddToCart={onAddRecommendationToCart}
        onOpenImage={onOpenImage}
      />
    </div>
  );
}

function AssistantUnifiedBubble({
  segments,
  bubbleClass,
  bubbleStyle,
  theme,
  embedded,
  avatarUrl,
  primary,
  quickReplies,
  onQuickReply,
  quickRepliesDisabled,
  onAddRecommendationToCart,
  onOpenImage,
}) {
  const hasRecs = segments.some((s) => s.type === "dish" || s.type === "cards");
  const { intro, menu, outro } = splitAssistantSegments(segments);
  let dishCounter = 0;

  return (
    <div className="chat-msg-enter flex w-full items-start gap-2.5 sm:gap-3">
      <BotAvatar avatarUrl={avatarUrl} color={primary} />
      <div
        className={`min-w-0 flex-1 shadow-sm ${bubbleClass} ${hasRecs ? "!px-3.5 !py-3.5 sm:!px-4 sm:!py-4" : ""}`}
        style={{
          ...bubbleStyle,
          ...(hasRecs
            ? {
                boxShadow: `0 8px 28px -16px ${hexAlpha(primary, 0.28)}`,
                outline: `1px solid ${hexAlpha(primary, 0.1)}`,
              }
            : {}),
        }}
        {...(hasRecs && onAddRecommendationToCart ? { "data-menu-recs": "1" } : {})}
      >
        <div className="flex flex-col">
          {intro.map((seg, idx) => {
            const meaningful = seg.lines.some((l) => String(l).trim());
            if (!meaningful) return null;
            return (
              <div key={`intro-${idx}`} className={idx > 0 ? "mt-2" : ""}>
                <TextLines
                  lines={seg.lines}
                  inBubble
                  lineClassName={
                    hasRecs && idx === 0
                      ? "text-[14px] font-medium leading-[1.6] text-slate-800 sm:text-[15px]"
                      : undefined
                  }
                />
              </div>
            );
          })}

          {menu.length > 0 ? (
            <DishListPanel primary={primary}>
              <MenuPicksLabel color={primary} />
              {menu.map((seg, idx) => {
                if (seg.type === "dish") {
                  dishCounter += 1;
                  return (
                    <DishBlock
                      key={`dish-${seg.item.menuItemId || seg.item.name}-${idx}`}
                      seg={seg}
                      dishIndex={dishCounter}
                      theme={theme}
                      embedded={embedded}
                      primary={primary}
                      onAddRecommendationToCart={onAddRecommendationToCart}
                      onOpenImage={onOpenImage}
                      showMenuLabel={false}
                      spacedTop={dishCounter > 1}
                    />
                  );
                }
                if (seg.type === "cards" && seg.items?.length) {
                  return seg.items.map((it) => {
                    dishCounter += 1;
                    return (
                      <MenuRecommendationCard
                        key={`${it.menuItemId || it.name}-${it.name}`}
                        item={it}
                        theme={theme}
                        embedded={embedded}
                        compact
                        inBubble
                        onAddToCart={onAddRecommendationToCart}
                        onOpenImage={onOpenImage}
                      />
                    );
                  });
                }
                return null;
              })}
            </DishListPanel>
          ) : null}

          {outro.map((seg, idx) => {
            const meaningful = seg.lines.some((l) => String(l).trim());
            if (!meaningful) return null;
            return (
              <div
                key={`outro-${idx}`}
                className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]"
              >
                <TextLines
                  lines={seg.lines}
                  inBubble
                  lineClassName="text-[13px] leading-[1.6] text-slate-600 dark:text-slate-300 sm:text-[14px]"
                />
              </div>
            );
          })}

          <QuickReplyChips
            replies={quickReplies}
            primary={primary}
            onSelect={onQuickReply}
            disabled={quickRepliesDisabled}
          />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  m,
  theme,
  p,
  embedded,
  avatarUrl,
  onAddRecommendationToCart,
  onQuickReply,
  quickRepliesDisabled,
}) {
  const [expandedUrl, setExpandedUrl] = useState(null);
  const menuCards =
    !m.isFromUser && Array.isArray(m.menuRecommendations) && m.menuRecommendations.length > 0
      ? m.menuRecommendations
      : null;
  const hasText = Boolean((m.content || "").trim());
  const normalizedContent = (m.content || "")
    .split("\n")
    .map((line) => (m.isFromUser ? line : normalizeAssistantLine(line)))
    .join("\n");

  const bubbleStyle = {
    background: m.isFromUser ? theme.userBubbleBg || p : theme.botBubbleBg || "#f8fafc",
    color: m.isFromUser ? theme.userBubbleText || "#fff" : theme.botBubbleText || "#1e293b",
    boxShadow: m.isFromUser
      ? `0 8px 24px -8px ${hexAlpha(p, 0.45)}`
      : `0 4px 20px -12px ${hexAlpha(p, 0.12)}`,
  };

  if (m.isFromUser) {
    const lines = normalizedContent.split("\n");
    return (
      <div className="chat-msg-enter flex w-full items-start justify-end gap-2 sm:gap-2.5">
        <div
          className={`min-w-0 max-w-[78%] shadow-sm sm:max-w-[75%] ${bubbleShellClass({ embedded, isFromUser: true })}`}
          style={bubbleStyle}
        >
          <TextLines lines={lines} />
        </div>
        <GuestAvatar color={p} />
      </div>
    );
  }

  const segments = menuCards
    ? buildInterleavedMessageSegments(normalizedContent, menuCards)
    : hasText
      ? [{ type: "text", lines: normalizedContent.split("\n") }]
      : [];

  const hasUnifiedContent = hasText || menuCards;

  if (!hasUnifiedContent) return null;

  const bubbleClass = bubbleShellClass({ embedded, isFromUser: false });

  return (
    <div className={`flex w-full flex-col items-start ${embedded ? "max-w-[95%]" : "max-w-[92%] sm:max-w-[88%]"}`}>
      <AssistantUnifiedBubble
        segments={segments}
        bubbleClass={bubbleClass}
        bubbleStyle={bubbleStyle}
        theme={theme}
        embedded={embedded}
        avatarUrl={avatarUrl}
        primary={p}
        quickReplies={m.quickReplies}
        onQuickReply={onQuickReply}
        quickRepliesDisabled={quickRepliesDisabled}
        onAddRecommendationToCart={onAddRecommendationToCart}
        onOpenImage={setExpandedUrl}
      />
      <ImageLightbox url={expandedUrl} onClose={() => setExpandedUrl(null)} />
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
  onStartNewConversation = null,
  showStartNewConversation = false,
  startNewConversationDisabled = false,
  startNewConversationLoading = false,
  startNewConversationTitle = null,
  messagesContainerRef,
  discountBanner,
  embedded = false,
  /** Design-studio preview: show blurred background inside the phone (sibling Background is covered by opaque message area). */
  backgroundImageUrl = null,
  /** When set, recommendation cards show an "Add to cart" control (table session). */
  onAddRecommendationToCart = null,
  /** Tap a suggested reply chip (e.g. fill composer or send). */
  onQuickReply = null,
  /** Disable typing/sending (e.g. AI off for this venue). */
  composerDisabled = false,
  /** When set, table QR guest UI: brand in header; table + order status share the strip under the header. */
  guestTableNumber = null,
  /** Order status (e.g. pill) in the same strip as the table badge, below the guest header. */
  guestOrderStatusPill = null,
}) {
  const theme = useChatTheme();
  const p = theme.primaryColor || "#2563eb";
  const sharp = Math.max(0, Math.min(100, Number(theme.backgroundSharpness ?? 100)));
  const blurPx = ((100 - sharp) / 100) * 8;
  const showEmbeddedBg = embedded && !!backgroundImageUrl;

  /** GPTA-style: full viewport width, content column max-w-3xl — not a narrow phone card. */
  if (!embedded) {
    const displayTitle = String((theme.brandName || agentName || "").trim() || agentName || "Assistant");
    const guestPill = guestTableNumber != null;
    return (
      <div className="relative z-10 flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden font-sans antialiased leading-relaxed">
        <header
          className={`shrink-0 border-b backdrop-blur-md ${guestPill ? "border-white/10" : "border-black/10"}`}
          style={{
            paddingTop: "max(0.3rem, env(safe-area-inset-top))",
            background: theme.headerBg || "rgba(255,255,255,0.92)",
            color: theme.headerText || "#0f172a",
          }}
        >
          <div
            className={`mx-auto flex max-w-3xl min-w-0 items-center justify-between gap-2 px-3 sm:px-4 ${guestPill ? "min-h-[3.25rem] py-2.5 sm:min-h-[3.5rem] sm:py-3" : "py-2 sm:py-2.5"}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow ring-1 ring-white/30 sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-md sm:ring-2"
                />
              ) : (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow ring-1 ring-white/30 sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-md sm:ring-2"
                  style={{ background: `linear-gradient(145deg, ${p} 0%, ${hexAlpha(p, 0.75)} 100%)` }}
                >
                  <i className="pi pi-comments text-base text-white sm:text-lg" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {guestPill ? (
                  <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1.5">
                    <p
                      className="min-w-0 truncate text-base font-semibold leading-tight tracking-tight sm:text-lg"
                      style={{ color: theme.headerText || "#0f172a" }}
                    >
                      {displayTitle}
                    </p>
                    {theme.brandTagline ? (
                      <p
                        className="line-clamp-1 truncate text-[10px] leading-snug sm:text-xs"
                        style={{ color: theme.headerText || "#0f172a", opacity: 0.88 }}
                      >
                        {theme.brandTagline}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight sm:text-base">{agentName}</p>
                    {theme.brandTagline ? (
                      <p className="mt-0 hidden min-[400px]:block truncate text-[10px] leading-tight text-slate-500 sm:mt-0.5 sm:text-xs">
                        {theme.brandTagline}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            {typeof onStartNewConversation === "function" && showStartNewConversation ? (
              <div className="flex min-w-0 max-w-[46%] shrink-0 items-center justify-end sm:max-w-[42%]">
                <button
                  type="button"
                  onClick={onStartNewConversation}
                  disabled={startNewConversationDisabled || startNewConversationLoading}
                  title={startNewConversationTitle || "Clear the thread and start fresh"}
                  className="inline-flex min-h-9 min-w-0 max-w-full shrink-0 items-center justify-center gap-0.5 rounded-full border-2 border-white/90 bg-white/95 px-1.5 py-1.5 text-[8px] font-semibold leading-tight shadow-md ring-1 ring-black/5 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:min-h-10 min-[400px]:gap-1.5 min-[400px]:px-2.5 min-[400px]:py-2 min-[400px]:text-xs"
                  style={{ color: p }}
                >
                  <i
                    className={`shrink-0 text-[8px] min-[400px]:text-xs ${
                      startNewConversationLoading ? "pi pi-spin pi-spinner" : "pi pi-refresh"
                    }`}
                  />
                  <span className="min-w-0 truncate text-left">
                    <span className="min-[400px]:hidden">New</span>
                    <span className="hidden min-[400px]:inline min-[500px]:hidden">Start new</span>
                    <span className="hidden min-[500px]:inline">Start new conversation</span>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </header>
        {guestPill ? (
          <div className="shrink-0 border-b border-white/5 bg-slate-950/15 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2.5 gap-y-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
              <div
                className="inline-flex shrink-0 select-none items-center gap-1.5 rounded-full border border-slate-200/60 bg-white px-2.5 py-1.5 pl-2 shadow-sm ring-1 ring-black/5 sm:px-3 sm:py-2"
                title="Your table"
                aria-label={
                  !guestTableNumber || guestTableNumber === "—"
                    ? "Table number not on file for this table"
                    : `Table ${guestTableNumber}`
                }
              >
                <span className="text-[0.65rem] font-extrabold uppercase leading-none tracking-[0.1em] text-slate-600 sm:text-xs sm:tracking-[0.12em]">
                  Table
                </span>
                <span
                  className="min-w-[1.15rem] text-center text-base font-black tabular-nums leading-none sm:min-w-6 sm:text-lg"
                  style={{ color: p }}
                >
                  {!guestTableNumber || guestTableNumber === "—" ? "?" : String(guestTableNumber)}
                </span>
              </div>
              {guestOrderStatusPill ? (
                <>
                  <div className="hidden h-4 w-px shrink-0 self-center bg-white/20 sm:block" aria-hidden />
                  {guestOrderStatusPill}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {discountBanner ? (
          <div
            className="shrink-0 text-center text-[10px] font-semibold tracking-wide sm:text-xs"
            style={{
              background: theme.voucherBannerBg || "#f59e0b",
              color: theme.voucherBannerText || "#fff",
            }}
          >
            <div className="mx-auto max-w-3xl px-3 py-1.5 sm:px-4 sm:py-2">{discountBanner}</div>
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
          <div className="mx-auto w-full max-w-3xl space-y-3 px-3 py-2 sm:space-y-4 sm:px-6 sm:py-4 md:space-y-5 md:py-5">
            {messages.map((m) => (
              <MessageBubble
                key={m.messageId}
                m={m}
                theme={theme}
                p={p}
                avatarUrl={avatarUrl}
                embedded={false}
                onAddRecommendationToCart={onAddRecommendationToCart}
                onQuickReply={onQuickReply}
                quickRepliesDisabled={sending || composerDisabled}
              />
            ))}
            {thinking ? (
              <div className="chat-msg-enter flex w-full max-w-[92%] items-start gap-2 sm:max-w-[88%] sm:gap-2.5">
                <BotAvatar avatarUrl={avatarUrl} color={p} />
                <div
                  className="inline-flex items-center gap-2 rounded-[1.15rem] rounded-bl-md px-4 py-2.5 text-sm ring-1 ring-slate-200/80 shadow-sm"
                  style={{
                    background: theme.botBubbleBg || "#f8fafc",
                    color: theme.botBubbleText || "#475569",
                    boxShadow: `0 4px 20px -12px ${hexAlpha(p, 0.12)}`,
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
          <div className="mx-auto max-w-3xl px-3 py-1.5 sm:px-5 sm:py-2.5">
            <div
              className="flex items-end gap-1.5 rounded-xl bg-white p-1 pl-2.5 ring-1 ring-slate-200/90 transition-shadow focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-[color:var(--chat-ring)] sm:gap-2 sm:rounded-2xl sm:p-1.5 sm:pl-3"
              style={{
                ["--chat-ring"]: hexAlpha(p, 0.38),
                boxShadow: `0 2px 12px -6px ${hexAlpha(p, 0.08)}`,
              }}
            >
              <span className="mb-2.5 hidden shrink-0 pl-0.5 text-slate-400 sm:mb-3 sm:inline" aria-hidden>
                <i className="pi pi-comment text-base" />
              </span>
              <textarea
                rows={1}
                className="min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent px-0.5 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:min-h-[48px] sm:rounded-xl sm:py-3 sm:text-base"
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
                className="flex min-h-[38px] min-w-[44px] shrink-0 items-center justify-center rounded-lg px-2 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[44px] sm:min-w-[96px] sm:rounded-xl sm:px-3"
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
          {typeof onStartNewConversation === "function" && showStartNewConversation ? (
            <div className="flex shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={onStartNewConversation}
                disabled={startNewConversationDisabled || startNewConversationLoading}
                title={startNewConversationTitle || "Clear the thread and start fresh"}
                className="inline-flex max-w-[min(14rem,50vw)] items-center justify-center gap-1.5 rounded-full border-2 border-white/90 bg-white px-2.5 py-1.5 text-[12px] font-semibold leading-tight shadow-md ring-1 ring-black/5 transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: p }}
              >
                <i
                  className={`shrink-0 text-xs ${
                    startNewConversationLoading ? "pi pi-spin pi-spinner" : "pi pi-refresh"
                  }`}
                />
                <span className="min-w-0 truncate">Start new conversation</span>
              </button>
            </div>
          ) : null}
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
              avatarUrl={avatarUrl}
              embedded
              onAddRecommendationToCart={onAddRecommendationToCart}
              onQuickReply={onQuickReply}
              quickRepliesDisabled={sending || composerDisabled}
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
