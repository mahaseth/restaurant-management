"use client";

import { useCallback, useState } from "react";

export function useCouponRedemption() {
  const [stage, setStage] = useState("idle");

  const requestEndChat = useCallback(() => {
    setStage("voucher");
  }, []);

  const cancelToChat = useCallback(() => {
    setStage("idle");
  }, []);

  return { stage, requestEndChat, cancelToChat };
}
