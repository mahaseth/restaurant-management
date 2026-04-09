"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy path: forwards to unified table guest flow. */
export default function LegacyAiChatQrRedirect() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params?.qrToken;

  useEffect(() => {
    if (!qrToken) return;
    router.replace(`/table/qr/${encodeURIComponent(String(qrToken))}`);
  }, [qrToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <i className="pi pi-spin pi-spinner text-2xl text-indigo-500" />
    </div>
  );
}
