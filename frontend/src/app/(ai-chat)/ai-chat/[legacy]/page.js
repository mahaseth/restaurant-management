"use client";

import { useParams } from "next/navigation";

export default function LegacyPublicAiChatNotice() {
  const params = useParams();
  const legacy = params?.legacy;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-100 to-slate-200/90 font-sans antialiased">
      <div className="max-w-md w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <i className="pi pi-info-circle text-2xl" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">This chat link is no longer supported</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          AI chat is only available through the <strong>table QR code</strong> at your venue. Ask staff if you need help
          finding it.
        </p>
        {legacy && legacy !== "qr" && legacy !== "session" ? (
          <p className="mt-4 text-xs text-slate-500 font-mono break-all opacity-80">{String(legacy)}</p>
        ) : null}
      </div>
    </div>
  );
}
