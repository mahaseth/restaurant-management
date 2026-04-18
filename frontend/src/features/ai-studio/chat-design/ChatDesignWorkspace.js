"use client";

import React, { useMemo, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import AssetUploadRow from "./AssetUploadRow";
import { mergeWithDefaults, COLOR_OVERRIDE_KEYS } from "./themeDefaults";
import { resolveTheme, getThinkingMessagesForStyle } from "@/features/ai-chat/utils/chatTheme";
import { ChatThemeProvider } from "@/features/ai-chat/utils/ThemeProvider";
import ChatShell from "@/features/ai-chat/components/ChatShell";
import VoucherModal from "@/features/ai-chat/components/VoucherModal";
import { deriveChatPalette } from "@/features/ai-chat/utils/brandingPalette";
import { surfaceBackgroundStyle } from "@/features/ai-chat/utils/surfaceBackgroundStyle";

const TABS = [
  { id: "brand", label: "Brand", icon: "pi pi-palette", hint: "Color, name, images, thinking style" },
  { id: "loading", label: "Loading", icon: "pi pi-spin", hint: "First screen while the chat connects" },
  { id: "welcome", label: "Welcome", icon: "pi pi-star", hint: "Full-screen welcome before messages" },
  { id: "chat", label: "Chat", icon: "pi pi-comments", hint: "Header, bubbles, composer, banner" },
  { id: "voucher", label: "Voucher", icon: "pi pi-ticket", hint: "End-of-session discount screen" },
];

/**
 * Bounded preview panel (GPTA chat-design style): no device chrome; fills the column so the page fits on screen.
 */
function PreviewPanel({ label, hint, children }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2.5">
      <div className="shrink-0 rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900/80">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Live preview</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          </div>
        </div>
        {hint ? <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{hint}</p> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-b from-slate-50/95 to-white shadow-md ring-1 ring-slate-200/50 dark:border-gray-700 dark:from-slate-900/90 dark:to-slate-950 dark:ring-slate-700/60">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit] p-1 sm:p-1.5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-950">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Studio loading — fits the preview panel without scrolling (GPTA-style). */
function StudioLoadingPreview({ theme }) {
  const brandLine = [theme.brandName, theme.brandTagline].filter(Boolean).join(" · ");
  const p = theme.primaryColor || "#2563eb";
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6"
      style={surfaceBackgroundStyle(theme.loadingBg)}
    >
      {brandLine ? (
        <p
          className="mb-6 max-w-[20rem] px-1 text-center text-[14px] font-semibold uppercase leading-[1.35] tracking-[0.18em]"
          style={{ color: theme.loadingTextColor }}
        >
          {brandLine}
        </p>
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-center text-[14px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Your brand name
        </p>
      )}
      <div className="relative mb-6 flex h-4 w-[min(13rem,78%)] items-center">
        <div
          className="absolute inset-x-[12%] h-2.5 rounded-full"
          style={{
            background: `linear-gradient(to right, transparent, ${theme.loadingGlowColor || p}, transparent)`,
            filter: "blur(6px)",
            opacity: 0.88,
          }}
        />
        <div
          className="relative z-10 h-[3px] w-full"
          style={{ background: `linear-gradient(to right, transparent, ${p}, transparent)` }}
        />
      </div>
      <p
        className="line-clamp-2 max-w-[18rem] px-2 text-center text-[16px] font-medium uppercase leading-snug tracking-[0.12em]"
        style={{ color: theme.loadingTextColor }}
      >
        {theme.loadingText}
      </p>
    </div>
  );
}

/** Studio welcome — no scroll inside the device (GPTA-style). */
function StudioWelcomePreview({ theme, agentName, avatarUrl }) {
  const brandLine = [theme.brandName, theme.brandTagline].filter(Boolean).join(" · ");
  const p = theme.primaryColor || "#2563eb";
  const displayName = agentName || "Your Assistant";
  const initial = (displayName || "A").charAt(0).toUpperCase();
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-5"
      style={surfaceBackgroundStyle(theme.welcomeBg)}
    >
      {brandLine ? (
        <p
          className="mb-6 max-w-[20rem] px-1 text-center text-[14px] font-semibold uppercase leading-[1.35] tracking-[0.18em]"
          style={{ color: theme.welcomeTextColor }}
        >
          {brandLine}
        </p>
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-center text-[14px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Your brand name
        </p>
      )}
      {avatarUrl ? (
        <div
          className="mb-5 h-20 w-20 overflow-hidden rounded-full border-2 shadow-lg ring-2 ring-black/10"
          style={{ borderColor: `${p}99` }}
        >
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg ring-2 ring-black/10"
          style={{
            background: `linear-gradient(135deg, ${p}40, ${p}18)`,
            borderColor: `${p}77`,
          }}
        >
          <span className="text-[28px] font-bold tracking-tight" style={{ color: `${p}e6` }}>
            {initial}
          </span>
        </div>
      )}
      <h2 className="mb-2 text-center text-[24px] font-bold leading-tight tracking-tight text-white">{displayName}</h2>
      <div className="mb-5 h-[3px] w-16" style={{ background: `linear-gradient(to right, transparent, ${p}, transparent)` }} />
      <p
        className="line-clamp-3 max-w-[min(20rem,88%)] px-1 text-center text-[16px] font-normal leading-relaxed"
        style={{ color: theme.welcomeTextColor }}
      >
        {theme.welcomeHeading}
      </p>
      {theme.welcomeSubtext ? (
        <p
          className="mt-2 line-clamp-2 max-w-[min(20rem,88%)] px-1 text-center text-[14px] leading-snug"
          style={{ color: theme.welcomeSubtextColor }}
        >
          {theme.welcomeSubtext}
        </p>
      ) : null}
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Entering chat</p>
    </div>
  );
}

function studioVoucherBorder(hex) {
  if (!hex || typeof hex !== "string") return "rgba(0,0,0,0.2)";
  const t = hex.trim();
  if (t.startsWith("#") && t.length === 7) return `${t}33`;
  return t;
}

/**
 * Studio voucher — matches GPTA `VoucherPreview`: centered, compact type, no scroll inside the phone.
 */
function StudioVoucherPreview({ theme, barcodeUrl }) {
  const header = theme.voucherHeaderBg || theme.primaryColor || "#2563eb";
  const bodyText = theme.voucherBody || "";
  const bodyPreview = bodyText.length > 140 ? `${bodyText.slice(0, 140)}…` : bodyText;
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4"
      style={surfaceBackgroundStyle(theme.voucherModalBg)}
    >
      <div
        className="mb-3 w-full rounded-xl p-3 text-center"
        style={{ background: `linear-gradient(135deg, ${header}, ${header}cc)` }}
      >
        <i className="pi pi-gift mx-auto mb-1 block text-3xl leading-none" style={{ color: theme.voucherHeaderText }} />
        <h2 className="line-clamp-2 text-base font-bold leading-tight" style={{ color: theme.voucherHeaderText }}>
          {theme.voucherHeading}
        </h2>
      </div>
      {theme.brandName ? (
        <p className="mb-2 text-center text-sm font-bold" style={{ color: theme.voucherBodyText }}>
          {theme.brandName}
        </p>
      ) : (
        <p className="mb-2 rounded border border-dashed border-slate-200 px-2 py-0.5 text-center text-sm font-bold text-slate-300">
          Brand name
        </p>
      )}
      {barcodeUrl ? (
        <div
          className="mb-2 w-full rounded-lg border p-2 text-center"
          style={{ borderColor: `${header}66`, backgroundColor: theme.voucherCardBg }}
        >
          <img src={barcodeUrl} alt="Barcode" className="mx-auto max-h-12 object-contain" />
        </div>
      ) : (
        <div
          className="mb-2 w-full rounded-lg border-2 border-dashed p-4 text-center"
          style={{ borderColor: `${header}66`, backgroundColor: theme.voucherCardBg }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-32 rounded bg-slate-200" />
            <span className="text-[11px] text-slate-500">Barcode / voucher image</span>
          </div>
        </div>
      )}
      {theme.discountEnabled ? (
        <p className="mb-1 px-1 text-center text-xs font-semibold" style={{ color: theme.voucherBodyText }}>
          <span style={{ color: header }}>{theme.discountPercent} off</span>
        </p>
      ) : null}
      <div
        className="mb-3 w-full rounded-lg border p-2 text-center"
        style={{ backgroundColor: theme.voucherBodyBg, borderColor: studioVoucherBorder(theme.voucherBodyText) }}
      >
        <p className="line-clamp-3 text-[13px] font-medium leading-snug" style={{ color: theme.voucherBodyText }}>
          {bodyPreview}
        </p>
      </div>
      <button
        type="button"
        className="mb-1.5 w-full rounded-full py-2 text-xs font-semibold"
        style={{ backgroundColor: theme.voucherPrimaryButtonBg, color: theme.voucherPrimaryButtonText }}
      >
        Continue with the chat
      </button>
      <button
        type="button"
        className="w-full rounded-full py-2 text-xs font-semibold"
        style={{ backgroundColor: theme.voucherSecondaryButtonBg, color: theme.voucherSecondaryButtonText }}
      >
        End Session
      </button>
    </div>
  );
}

function normalizeHex(s) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/i.test(t)) {
    const a = t.slice(1);
    return `#${a[0]}${a[0]}${a[1]}${a[1]}${a[2]}${a[2]}`;
  }
  return null;
}

function SectionHint({ children }) {
  return <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</p>;
}

function ScreenColors({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm dark:border-gray-700/80 dark:bg-gray-950/40 sm:p-5">
      <h4 className="mb-4 border-b border-gray-100 pb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
        {title}
      </h4>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ColorRow({ label, hint, fieldKey, t, resolved, setField }) {
  const value = t[fieldKey];
  const effective = value ?? "";
  const hex = normalizeHex(effective);
  const canPick = !effective || hex;
  const fallback = normalizeHex(String(resolved[fieldKey] ?? "")) || "#2563eb";
  const pickerVal = hex || fallback;

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-800 dark:text-gray-200">{label}</label>
      {hint ? <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">{hint}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {canPick ? (
          <input
            type="color"
            value={pickerVal}
            onChange={(e) => setField(fieldKey, e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-lg border border-gray-300 bg-white shadow-inner dark:border-gray-600 dark:bg-gray-800"
          />
        ) : (
          <div
            className="h-9 w-14 shrink-0 rounded-lg border border-gray-300 bg-gray-100 ring-1 ring-black/5 dark:border-gray-600"
            style={{ background: effective }}
            title="Preview"
          />
        )}
        <InputText
          value={effective}
          onChange={(e) => setField(fieldKey, e.target.value)}
          className="min-w-0 flex-1 font-mono text-xs sm:text-sm"
          placeholder="#hex or rgba()"
        />
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
          onClick={() => setField(fieldKey, "")}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/** Short thread + room for thinking row — studio preview must not scroll (GPTA-style). */
function buildChatPreviewMessagesWithThinking(theme) {
  const t = mergeWithDefaults(theme);
  const intro = `${(t.introHeading || "Hi!").slice(0, 36)}${(t.introHeading || "").length > 36 ? "…" : ""}`;
  return [
    { messageId: 1, content: intro, isFromUser: false },
    { messageId: 2, content: "What's on the menu?", isFromUser: true },
  ];
}

export default function ChatDesignWorkspace({
  agentDisplayName,
  onAgentDisplayNameChange,
  theme,
  onThemeChange,
  avatarUrl,
  backgroundUrl,
  voucherBarcodeUrl,
  onUploadAvatar,
  onUploadBackground,
  onUploadVoucherBarcode,
  onSave,
  saving,
  provisioned,
  onReload,
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("brand");
  const [studioVoucherPreviewOpen, setStudioVoucherPreviewOpen] = useState(false);
  const previewScrollRef = useRef(null);

  const setField = (key, value) => {
    const base = mergeWithDefaults(theme);
    if ((value === "" || value === undefined) && COLOR_OVERRIDE_KEYS.includes(key)) {
      const next = { ...base };
      delete next[key];
      onThemeChange(next);
      return;
    }
    onThemeChange({ ...base, [key]: value });
  };

  const t = mergeWithDefaults(theme);
  const resolved = useMemo(
    () => resolveTheme(t, agentDisplayName || t.brandName),
    [t, agentDisplayName]
  );

  const chatPreviewMessages = useMemo(() => buildChatPreviewMessagesWithThinking(theme), [theme]);
  const thinkingLine = getThinkingMessagesForStyle(t.thinkingTextStyle)[0] || "Thinking…";
  const paletteStrip = useMemo(() => deriveChatPalette(t.primaryColor || "#2563eb"), [t.primaryColor]);

  const controlsBrand = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Brand color</h3>
        <SectionHint>
          This color seeds the palette. Each screen tab can override its own colors without losing your defaults.
        </SectionHint>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div
            className="relative h-24 w-24 shrink-0 rounded-2xl border-2 border-gray-200 shadow-md ring-2 ring-black/5 dark:border-gray-600"
            style={{
              background: t.primaryColor?.startsWith("#") ? t.primaryColor : "#2563eb",
              boxShadow: "0 22px 44px -14px rgba(0,0,0,0.35)",
            }}
          >
            <input
              type="color"
              value={t.primaryColor?.startsWith("#") ? t.primaryColor : "#2563eb"}
              onChange={(e) => setField("primaryColor", e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick primary brand color"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Hex</label>
            <InputText
              value={t.primaryColor || ""}
              onChange={(e) => setField("primaryColor", e.target.value)}
              className="w-full max-w-xs font-mono text-sm"
              placeholder="#2563eb"
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Assistant display name</label>
          <InputText
            value={agentDisplayName}
            onChange={(e) => onAgentDisplayNameChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Brand name</label>
          <InputText value={t.brandName || ""} onChange={(e) => setField("brandName", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tagline</label>
          <InputText value={t.brandTagline || ""} onChange={(e) => setField("brandTagline", e.target.value)} />
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Images & media</h3>
        <div className="space-y-3">
          <AssetUploadRow label="Avatar" description="Header & fallback icon." currentUrl={avatarUrl} onUpload={onUploadAvatar} />
          <AssetUploadRow
            label="Background"
            description="Blurred behind the chat card on the guest page."
            currentUrl={backgroundUrl}
            onUpload={onUploadBackground}
          />
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Background sharpness ({t.backgroundSharpness ?? 100}%)
            </label>
            <Slider
              value={Number(t.backgroundSharpness ?? 100)}
              onChange={(e) => setField("backgroundSharpness", e.value)}
              min={0}
              max={100}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">Lower = more blur on the background photo.</p>
          </div>
          <AssetUploadRow
            label="Voucher / barcode"
            description="Same as the Voucher tab — shown on the end-of-session voucher screen."
            currentUrl={voucherBarcodeUrl}
            onUpload={onUploadVoucherBarcode}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">Thinking style</label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          The chat preview shows the thinking line and dots for the style you pick (same as the guest chat).
        </p>
        <select
          className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          value={t.thinkingTextStyle || "casual"}
          onChange={(e) => setField("thinkingTextStyle", e.target.value)}
        >
          <option value="casual">Casual</option>
          <option value="professional">Professional</option>
          <option value="classy">Classy</option>
          <option value="funny">Funny</option>
          <option value="humor">Humor</option>
        </select>
      </div>
    </div>
  );

  const controlsLoading = (
    <div className="space-y-6">
      <SectionHint>Guests see this screen while the session connects. Overrides apply only to this step.</SectionHint>
      <ScreenColors title="Colors — loading">
        <ColorRow
          label="Background"
          hint="Solid hex replaces the default gradient for this screen."
          fieldKey="loadingBg"
          t={t}
          resolved={resolved}
          setField={setField}
        />
        <ColorRow
          label="Accent glow & rings"
          fieldKey="loadingGlowColor"
          t={t}
          resolved={resolved}
          setField={setField}
        />
        <ColorRow
          label="Title text"
          fieldKey="loadingTextColor"
          t={t}
          resolved={resolved}
          setField={setField}
        />
      </ScreenColors>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading text</label>
        <InputText value={t.loadingText || ""} onChange={(e) => setField("loadingText", e.target.value)} />
      </div>
    </div>
  );

  const controlsWelcome = (
    <div className="space-y-6">
      <SectionHint>Full-screen welcome before messages. Styling is independent from Loading and Chat.</SectionHint>
      <ScreenColors title="Colors — welcome">
        <ColorRow label="Background" fieldKey="welcomeBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Heading text" fieldKey="welcomeTextColor" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Subtext" fieldKey="welcomeSubtextColor" t={t} resolved={resolved} setField={setField} />
      </ScreenColors>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Welcome heading</label>
        <InputText value={t.welcomeHeading || ""} onChange={(e) => setField("welcomeHeading", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Welcome subtext</label>
        <InputText value={t.welcomeSubtext || ""} onChange={(e) => setField("welcomeSubtext", e.target.value)} />
      </div>
    </div>
  );

  const controlsChat = (
    <div className="space-y-6">
      <SectionHint>
        Header, bubbles, composer, and discount strip. The preview shows sample messages and the thinking row (style is set under Brand → Thinking style).
      </SectionHint>
      <ScreenColors title="Colors — chat">
        <ColorRow
          label="Header background"
          hint="Supports rgba(), e.g. rgba(255,255,255,0.85)"
          fieldKey="headerBg"
          t={t}
          resolved={resolved}
          setField={setField}
        />
        <ColorRow label="Header title" fieldKey="headerText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Messages area" fieldKey="pageBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Composer bar" fieldKey="composerBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="User bubble" fieldKey="userBubbleBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="User bubble text" fieldKey="userBubbleText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Assistant bubble" fieldKey="botBubbleBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Assistant text" fieldKey="botBubbleText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Discount banner" fieldKey="voucherBannerBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Discount banner text" fieldKey="voucherBannerText" t={t} resolved={resolved} setField={setField} />
      </ScreenColors>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Intro heading</label>
        <InputText value={t.introHeading || ""} onChange={(e) => setField("introHeading", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Intro body</label>
        <InputTextarea value={t.introBody || ""} onChange={(e) => setField("introBody", e.target.value)} rows={3} />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Open the full-screen voucher the guest would see (for layout check). The Voucher tab is the main editor.
        </p>
        <Button
          type="button"
          label="Preview full voucher modal"
          icon="pi pi-ticket"
          className="p-button-outlined w-full"
          onClick={() => setStudioVoucherPreviewOpen(true)}
        />
      </div>
    </div>
  );

  const controlsVoucher = (
    <div className="space-y-6">
      <SectionHint>
        End-of-session voucher screen. Upload a barcode or promo image; set discount copy and colors below.
      </SectionHint>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Voucher / discount image</h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Shown on the voucher step and in the live preview when you open the Voucher tab.
        </p>
        <AssetUploadRow
          label="Barcode or voucher graphic"
          description="PNG, JPG, or SVG. Appears in the voucher card above the body text."
          currentUrl={voucherBarcodeUrl}
          onUpload={onUploadVoucherBarcode}
        />
      </div>
      <ScreenColors title="Colors — voucher">
        <ColorRow label="Modal background" fieldKey="voucherModalBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Header gradient base" fieldKey="voucherHeaderBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Header title" fieldKey="voucherHeaderText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Ticket / card area" fieldKey="voucherCardBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Body strip" fieldKey="voucherBodyBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Body text" fieldKey="voucherBodyText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Primary button" fieldKey="voucherPrimaryButtonBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Primary button text" fieldKey="voucherPrimaryButtonText" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Secondary button" fieldKey="voucherSecondaryButtonBg" t={t} resolved={resolved} setField={setField} />
        <ColorRow label="Secondary text" fieldKey="voucherSecondaryButtonText" t={t} resolved={resolved} setField={setField} />
      </ScreenColors>
      <div className="flex items-center gap-3">
        <InputSwitch checked={!!t.discountEnabled} onChange={(e) => setField("discountEnabled", e.value)} />
        <span className="text-sm text-gray-700 dark:text-gray-300">Enable discount flow</span>
      </div>
      <div className="flex flex-col gap-2 max-w-xs">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Discount label</label>
        <InputText value={t.discountPercent || ""} onChange={(e) => setField("discountPercent", e.target.value)} placeholder="5%" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Banner text (in chat)</label>
        <InputText value={t.voucherBannerLabel || ""} onChange={(e) => setField("voucherBannerLabel", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Voucher heading</label>
        <InputText value={t.voucherHeading || ""} onChange={(e) => setField("voucherHeading", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Voucher body</label>
        <InputTextarea value={t.voucherBody || ""} onChange={(e) => setField("voucherBody", e.target.value)} rows={2} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Coupon helper text</label>
        <InputText value={t.couponPageSubtext || ""} onChange={(e) => setField("couponPageSubtext", e.target.value)} />
      </div>
    </div>
  );

  const previewLoading = (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <StudioLoadingPreview theme={resolved} />
    </div>
  );

  const previewWelcome = (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <StudioWelcomePreview
        theme={resolved}
        agentName={agentDisplayName || t.brandName || "Assistant"}
        avatarUrl={avatarUrl || null}
      />
    </div>
  );

  const previewChat = (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <ChatThemeProvider theme={resolved}>
        <ChatShell
          embedded
          backgroundImageUrl={backgroundUrl || null}
          agentName={agentDisplayName || t.brandName || "Assistant"}
          avatarUrl={avatarUrl || null}
          messages={chatPreviewMessages}
          thinking
          thinkingText={thinkingLine}
          messageInput=""
          setMessageInput={() => {}}
          onSend={(e) => e?.preventDefault?.()}
          sending={false}
          messagesContainerRef={previewScrollRef}
          discountBanner={null}
        />
        <VoucherModal
          embedded
          open={activeTab === "chat" && studioVoucherPreviewOpen}
          barcodeUrl={voucherBarcodeUrl || null}
          onViewFullscreen={() => {}}
          onContinueChat={() => setStudioVoucherPreviewOpen(false)}
          onEndSession={() => setStudioVoucherPreviewOpen(false)}
        />
      </ChatThemeProvider>
    </div>
  );

  const previewVoucher = (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <StudioVoucherPreview theme={resolved} barcodeUrl={voucherBarcodeUrl || null} />
    </div>
  );

  const previewBrand = previewChat;

  let controls = controlsBrand;
  let preview = previewBrand;

  if (activeTab === "loading") {
    controls = controlsLoading;
    preview = previewLoading;
  } else if (activeTab === "welcome") {
    controls = controlsWelcome;
    preview = previewWelcome;
  } else if (activeTab === "chat") {
    controls = controlsChat;
    preview = previewChat;
  } else if (activeTab === "voucher") {
    controls = controlsVoucher;
    preview = previewVoucher;
  } else {
    controls = controlsBrand;
    preview = previewBrand;
  }

  const previewMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  const swatches = [
    { label: "Primary", color: paletteStrip.primaryColor },
    { label: "User", color: paletteStrip.userBubbleBg },
    { label: "Assistant", color: paletteStrip.botBubbleBg },
    { label: "Surface", color: paletteStrip.pageBgFlat },
    { label: "Accent", color: paletteStrip.voucherHeaderBg },
  ];

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md dark:border-gray-700 dark:bg-gray-950 ${className}`}
    >
      {/* Toolbar: palette + screen tabs + actions */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200/90 bg-gradient-to-b from-slate-50/95 to-white px-3 py-3 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:inline">
              Palette
            </span>
            <div
              className="flex flex-wrap items-center gap-1.5"
              title="Resolved colors from your primary — switch Screen tabs to override per step"
            >
              {swatches.map((s) => (
                <span
                  key={s.label}
                  className="h-6 w-6 shrink-0 rounded-full border border-gray-200 shadow-sm ring-1 ring-black/5 dark:border-gray-600"
                  style={{ background: s.color }}
                  title={s.label}
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onReload ? (
              <Button
                type="button"
                icon="pi pi-refresh"
                rounded
                text
                severity="secondary"
                onClick={onReload}
                aria-label="Reload data"
                className="!h-9 !w-9 !p-0"
              />
            ) : null}
            <Button
              type="button"
              label={saving ? "Saving…" : "Save"}
              icon="pi pi-check"
              size="small"
              onClick={onSave}
              disabled={saving || !provisioned}
              title="Saves guest chat look. Personality is on AI Studio."
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Screen</span>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "chat") setStudioVoucherPreviewOpen(false);
                  }}
                  className={`inline-flex min-h-[40px] shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:min-h-0 sm:text-sm ${
                    active
                      ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/25"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <i className={`${tab.icon} text-sm opacity-90`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor (scrolls) + preview (fits height, no scroll) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,min(42vw,480px))] lg:gap-5 lg:p-4 xl:gap-6 xl:p-5">
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-gray-100/90 bg-gradient-to-b from-gray-50/80 to-white p-4 shadow-inner dark:border-gray-800 dark:from-gray-900/40 dark:to-gray-950/40 sm:p-5">
          {controls}
        </div>
        <div className="flex min-h-[min(360px,45vh)] flex-col overflow-hidden lg:min-h-0 lg:max-h-full">
          <PreviewPanel label={previewMeta.label} hint={previewMeta.hint}>
            {preview}
          </PreviewPanel>
        </div>
      </div>
    </div>
  );
}
