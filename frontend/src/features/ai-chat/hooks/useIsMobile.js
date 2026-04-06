"use client";

import { useEffect, useState } from "react";

/** Match GPTA `useIsMobile` — width breakpoint + coarse mobile UA. */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const byWidth = typeof window !== "undefined" && window.innerWidth < breakpoint;
      const byUserAgent =
        typeof navigator !== "undefined" &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(!!byWidth || byUserAgent);
    };
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
