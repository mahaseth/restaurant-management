"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import {
  getAiStudioStatus,
  provisionAgent,
  syncMenuToVectorStore,
  patchAiBranding,
} from "@/api/aiStudio";
import { AI_STUDIO_CHAT_DESIGN_ROUTE, TABLES_ROUTE } from "@/constants/routes";
import AgentBehaviorSection from "@/features/ai-studio/AgentBehaviorSection";
import AiEvaluationPanel from "@/features/ai-studio/AiEvaluationPanel";

const SECTIONS = [
  {
    id: "setup",
    label: "Setup",
    icon: "pi pi-bolt",
    blurb: "Enable the agent; your menu syncs to the AI automatically when you change it in Menu management.",
  },
  {
    id: "personality",
    label: "Personality",
    icon: "pi pi-user",
    blurb: "How your assistant sounds and what extra rules it follows.",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "pi pi-palette",
    blurb: "Loading, welcome, chat, and voucher screens guests see.",
  },
  {
    id: "share",
    label: "Share",
    icon: "pi pi-qrcode",
    blurb: "Each table has one QR for chat (when AI is on), menu, cart, and ordering.",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    icon: "pi pi-chart-bar",
    blurb: "RAG retrieval logs, confidence, and fallbacks for research and tuning.",
  },
];

function StatusPill({ children, variant = "neutral" }) {
  const styles = {
    success: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-200",
    warning: "bg-amber-500/15 text-amber-900 ring-amber-500/20 dark:text-amber-100",
    danger: "bg-red-500/10 text-red-800 ring-red-500/20 dark:text-red-200",
    neutral: "bg-slate-500/10 text-slate-700 ring-slate-500/15 dark:text-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[variant] || styles.neutral}`}
    >
      {children}
    </span>
  );
}

export default function AiStudioPage() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [status, setStatus] = useState(null);
  const [section, setSection] = useState("setup");

  const [responseStyle, setResponseStyle] = useState("default");
  const [agentTone, setAgentTone] = useState("friendly");
  const [brandStory, setBrandStory] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [omitAgentName, setOmitAgentName] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAiStudioStatus();
      if (res.success && res.data) {
        setStatus(res.data);
        const d = res.data;
        setResponseStyle(d.responseStyle === "concise" || d.responseStyle === "verbose" ? d.responseStyle : "default");
        setAgentTone(typeof d.agentTone === "string" && d.agentTone ? d.agentTone : "friendly");
        setBrandStory(d.brandStory || "");
        setCustomInstructions(d.customInstructions || "");
        setOmitAgentName(!!d.omitAgentName);
      } else toast.error(res.error || "Could not load status");
    } catch (e) {
      toast.error(e?.response?.data || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProvision = async () => {
    setWorking(true);
    try {
      const res = await provisionAgent();
      if (res.success) {
        toast.success("AI agent enabled for your restaurant");
        await load();
      } else toast.error(res.error || "Failed");
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Failed");
    } finally {
      setWorking(false);
    }
  };

  const handleSavePersonality = async () => {
    setSavingPersonality(true);
    try {
      const res = await patchAiBranding({
        responseStyle,
        agentTone,
        brandStory,
        customInstructions,
        omitAgentName,
      });
      if (!res.success) {
        toast.error(res.error || "Save failed");
        return;
      }
      toast.success("Personality & instructions saved");
      if (res.data) {
        const d = res.data;
        if (d.responseStyle) setResponseStyle(d.responseStyle);
        if (d.agentTone) setAgentTone(d.agentTone);
        if (d.brandStory !== undefined) setBrandStory(d.brandStory || "");
        if (d.customInstructions !== undefined) setCustomInstructions(d.customInstructions || "");
        if (d.omitAgentName !== undefined) setOmitAgentName(!!d.omitAgentName);
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSavingPersonality(false);
    }
  };

  const handleSync = async () => {
    setWorking(true);
    try {
      const res = await syncMenuToVectorStore();
      if (res.success) {
        toast.success(`Manual sync complete — ${res.data?.rowCount ?? 0} menu items indexed for AI`);
        await load();
      } else toast.error(res.error || "Sync failed");
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Sync failed");
    } finally {
      setWorking(false);
    }
  };


  const activeMeta = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <i className="pi pi-spin pi-spinner text-4xl text-primary" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading AI Studio…</p>
      </div>
    );
  }

  const provisioned = !!status?.provisioned;
  const enabled = !!status?.enabled;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-10 animate-fade-in-up">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 p-6 text-white shadow-lg shadow-violet-500/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25 backdrop-blur sm:h-16 sm:w-16">
              <i className="pi pi-sparkles text-2xl sm:text-[1.75rem]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Studio</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                Set up your guest-facing assistant, tune how it speaks, and design the chat screens guests see after scanning
                their table&apos;s AI QR.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {provisioned ? (
              <StatusPill variant={enabled ? "success" : "warning"}>
                <i className={`pi ${enabled ? "pi-check-circle" : "pi-pause-circle"} text-[0.85rem]`} />
                {enabled ? "Agent on" : "Agent paused"}
              </StatusPill>
            ) : (
              <StatusPill variant="neutral">
                <i className="pi pi-circle-off text-[0.85rem]" />
                Not enabled yet
              </StatusPill>
            )}
            {provisioned && status?.menuRowCount != null ? (
              <StatusPill variant="neutral">
                <i className="pi pi-database text-[0.85rem]" />
                {status.menuRowCount} menu rows
              </StatusPill>
            ) : null}
          </div>
        </div>
      </header>

      {/* Section tabs */}
      <nav
        className="sticky top-0 z-10 -mx-1 flex gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/90 bg-gray-50/95 p-1.5 shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/90 sm:mx-0 sm:flex-wrap sm:overflow-visible"
        aria-label="AI Studio sections"
      >
        {SECTIONS.map((s) => {
          const on = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSection(s.id)}
              className={`flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:min-h-0 ${
                on
                  ? "bg-white text-primary shadow-md ring-1 ring-primary/20 dark:bg-gray-800 dark:text-primary"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-white"
              }`}
            >
              <i className={`${s.icon} text-base opacity-90`} />
              {s.label}
            </button>
          );
        })}
      </nav>

      <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">{activeMeta.blurb}</p>

      {/* Panels */}
      <div className="min-h-[320px]">
        {section === "setup" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agent & menu</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The AI answers from your live menu. Use <strong>Menu management</strong> to add, edit, or remove dishes —
                each change triggers an automatic sync to the AI search index.
              </p>
              <div className="mt-4 rounded-xl border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-100">
                <i className="pi pi-info-circle mr-2 text-sky-600 dark:text-sky-400" />
                <strong>Auto sync:</strong> runs in the background every time you add, edit, or remove a food item, or
                change a dish photo in Menu management — no action needed here.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  label={provisioned ? "Re-provision agent" : "Enable AI agent"}
                  icon="pi pi-bolt"
                  onClick={handleProvision}
                  disabled={working}
                  loading={working}
                />
                <Button
                  label="Manual sync"
                  icon="pi pi-sync"
                  onClick={handleSync}
                  disabled={working || !provisioned}
                  outlined
                  title="Re-index the full menu now. Use if something looks out of date; otherwise rely on auto sync."
                />
              </div>
              {status?.lastMenuSyncAt && (
                <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-gray-100">Last sync:</span>{" "}
                  {new Date(status.lastMenuSyncAt).toLocaleString()}
                </p>
              )}
              {status?.lastMenuSyncError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  <i className="pi pi-exclamation-triangle mr-2" />
                  {status.lastMenuSyncError}
                </p>
              )}
            </div>
          </div>
        )}

        {section === "personality" && (
          <AgentBehaviorSection
            provisioned={provisioned}
            responseStyle={responseStyle}
            onResponseStyleChange={setResponseStyle}
            agentTone={agentTone}
            onAgentToneChange={setAgentTone}
            brandStory={brandStory}
            onBrandStoryChange={setBrandStory}
            customInstructions={customInstructions}
            onCustomInstructionsChange={setCustomInstructions}
            omitAgentName={omitAgentName}
            onOmitAgentNameChange={setOmitAgentName}
            onSave={handleSavePersonality}
            saving={savingPersonality}
          />
        )}

        {section === "appearance" && (
          <div className="rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white to-slate-50/90 p-6 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-950 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg">
                  <i className="pi pi-mobile text-2xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guest chat designer</h2>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Full-screen previews for loading, welcome, chat, and voucher. Set your brand color, uploads, and copy
                    in one place.
                  </p>
                </div>
              </div>
              <Link href={AI_STUDIO_CHAT_DESIGN_ROUTE} className="shrink-0">
                <Button
                  label="Open design studio"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  disabled={!provisioned}
                  className="w-full sm:w-auto"
                />
              </Link>
            </div>
            {!provisioned && (
              <p className="mt-4 text-sm text-amber-800 dark:text-amber-200/90">
                <i className="pi pi-info-circle mr-2" />
                Enable the agent under <strong>Setup</strong> first, then customize appearance.
              </p>
            )}
          </div>
        )}

        {section === "evaluation" && <AiEvaluationPanel />}

        {section === "share" && (
          <div className="space-y-6">
            {!provisioned || !enabled ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-10 text-center dark:border-gray-600 dark:bg-gray-900/40">
                <i className="pi pi-qrcode mb-3 text-4xl text-gray-400" />
                <p className="font-medium text-gray-800 dark:text-gray-200">Table AI QR codes appear after the agent is on</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Complete <strong>Setup</strong> and ensure the agent is enabled, then open{" "}
                  <strong>Tables</strong> to print the assistant QR for each table.
                </p>
                <Button label="Go to Setup" className="mt-6" type="button" onClick={() => setSection("setup")} />
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How guests use the table QR</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Each table has <strong>one QR code</strong>. Scanning it opens chat (when AI is on), menu browsing,
                      cart, and ordering in a single session.
                    </p>
                  </div>
                  <Link href={TABLES_ROUTE} className="shrink-0">
                    <Button type="button" label="Open Tables" icon="pi pi-table" size="small" />
                  </Link>
                </div>
                <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-950 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100">
                  <i className="pi pi-info-circle mr-2" />
                  Regenerate a table&apos;s QR in Tables if you change Wi‑Fi or domain so printed codes stay correct.
                </div>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  Guests can ask about dishes, allergens, and specials before ordering. The conversation stays on the
                  device until they leave the chat or clear the session; refreshing the page keeps the thread as long as
                  they use the same session link.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
