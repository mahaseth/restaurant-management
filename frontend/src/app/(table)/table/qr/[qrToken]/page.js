"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { resolveQrSession } from "@/api/tableSession";

export default function TableQrEntryPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params?.qrToken;
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!qrToken) {
      setError("Invalid QR link");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await resolveQrSession(String(qrToken));
        if (cancelled) return;
        if (res.success && res.data?.sessionToken) {
          router.replace(`/table/session/${encodeURIComponent(res.data.sessionToken)}`);
          return;
        }
        setError(res.error || "Could not start session");
      } catch {
        if (!cancelled) setError("Could not start session. Check your connection and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans antialiased">
      <div className="max-w-sm w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80 px-8 py-10 text-center">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <i className="pi pi-exclamation-circle text-2xl" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Unable to open table</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{error}</p>
          </>
        ) : (
          <>
            <i className="pi pi-spin pi-spinner text-3xl text-indigo-500 mb-4" />
            <p className="text-sm text-slate-600">Opening your table…</p>
          </>
        )}
      </div>
    </div>
  );
}
