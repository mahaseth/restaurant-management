"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  getAiStudioStatus,
  patchAiBranding,
  uploadAiAvatar,
  uploadAiBackground,
  uploadAiVoucherBarcode,
} from "@/api/aiStudio";
import { AI_STUDIO_ROUTE } from "@/constants/routes";
import ChatDesignWorkspace from "@/features/ai-studio/chat-design/ChatDesignWorkspace";
import { mergeWithDefaults, pickChatThemeForSave } from "@/features/ai-studio/chat-design/themeDefaults";

export default function ChatDesignPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agentDisplayName, setAgentDisplayName] = useState("");
  const [theme, setTheme] = useState(mergeWithDefaults({}));
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [voucherBarcodeUrl, setVoucherBarcodeUrl] = useState("");

  const [provisioned, setProvisioned] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAiStudioStatus();
      if (!res.success || !res.data) {
        toast.error(res.error || "Could not load AI Studio");
        return;
      }
      const d = res.data;
      setProvisioned(!!d.provisioned);
      if (!d.provisioned) {
        toast.warn("Enable AI Studio first to customize the chat.");
      }
      setAgentDisplayName(d.agentDisplayName || "");
      setTheme(mergeWithDefaults(d.chatTheme || {}));
      setAvatarUrl(d.avatarUrl || "");
      setBackgroundUrl(d.backgroundImageUrl || "");
      setVoucherBarcodeUrl(d.voucherBarcodeUrl || "");
    } catch (e) {
      toast.error(e?.response?.data || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await patchAiBranding({
        agentDisplayName,
        chatTheme: pickChatThemeForSave(theme),
      });
      if (!res.success) {
        toast.error(res.error || "Save failed");
        return;
      }
      toast.success("Appearance saved");
      if (res.data) {
        setTheme(mergeWithDefaults(res.data.chatTheme || {}));
        if (res.data.agentDisplayName !== undefined) setAgentDisplayName(res.data.agentDisplayName);
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <i className="pi pi-spin pi-spinner text-3xl text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-col gap-3 animate-fade-in-up lg:h-[calc(100dvh-4.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <Link
            href={AI_STUDIO_ROUTE}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            aria-label="Back to AI Studio"
          >
            <i className="pi pi-arrow-left" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl">Chat appearance</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Edit each screen on the left — preview updates on the right. Save when you are happy.
            </p>
          </div>
        </div>
      </div>

      {!provisioned && (
        <div className="shrink-0 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <i className="pi pi-info-circle mr-2 text-amber-600 dark:text-amber-400" />
          Enable the AI agent on{" "}
          <Link href={AI_STUDIO_ROUTE} className="font-semibold text-amber-800 underline dark:text-amber-200">
            AI Studio
          </Link>{" "}
          before saving appearance.
        </div>
      )}

      <ChatDesignWorkspace
        className="min-h-0 flex-1 overflow-hidden"
        onReload={load}
        agentDisplayName={agentDisplayName}
        onAgentDisplayNameChange={setAgentDisplayName}
        theme={theme}
        onThemeChange={setTheme}
        avatarUrl={avatarUrl}
        backgroundUrl={backgroundUrl}
        voucherBarcodeUrl={voucherBarcodeUrl}
        provisioned={provisioned}
        onUploadAvatar={async (file) => {
          const res = await uploadAiAvatar(file);
          if (res.success && res.data?.avatarUrl) {
            setAvatarUrl(res.data.avatarUrl);
            toast.success("Avatar updated");
          } else toast.error(res.error || "Upload failed");
        }}
        onUploadBackground={async (file) => {
          const res = await uploadAiBackground(file);
          if (res.success && res.data?.backgroundImageUrl) {
            setBackgroundUrl(res.data.backgroundImageUrl);
            toast.success("Background updated");
          } else toast.error(res.error || "Upload failed");
        }}
        onUploadVoucherBarcode={async (file) => {
          const res = await uploadAiVoucherBarcode(file);
          if (res.success && res.data?.voucherBarcodeUrl) {
            setVoucherBarcodeUrl(res.data.voucherBarcodeUrl);
            toast.success("Voucher image updated");
          } else toast.error(res.error || "Upload failed");
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

