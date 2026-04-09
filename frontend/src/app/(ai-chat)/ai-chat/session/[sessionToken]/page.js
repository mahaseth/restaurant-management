"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy path: forwards to unified table guest flow. */
export default function LegacyAiChatSessionRedirect() {
  const params = useParams();
  const router = useRouter();
  const sessionToken = params?.sessionToken;

  useEffect(() => {
    if (!sessionToken) return;
    router.replace(`/table/session/${encodeURIComponent(String(sessionToken))}`);
  }, [sessionToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <i className="pi pi-spin pi-spinner text-2xl text-indigo-500" />
    </div>
  );
}
