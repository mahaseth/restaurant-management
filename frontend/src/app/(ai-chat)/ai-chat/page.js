export default function AiChatIndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-100 to-slate-200/90 font-sans antialiased">
      <div className="max-w-md w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <i className="pi pi-qrcode text-2xl" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Table guest app</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Scan the <strong>table QR code</strong> to open chat, menu, cart, and ordering. This page is only a placeholder
          if you opened <code className="text-xs">/ai-chat</code> directly.
        </p>
      </div>
    </div>
  );
}
