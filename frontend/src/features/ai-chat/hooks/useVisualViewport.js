"use client";

import { useEffect } from "react";

/**
 * Sets --vvh / --vvt on <html> for stable full-height chat (matches GPTA visualViewport handling).
 */
export function useVisualViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const root = document.documentElement;
    const vv = window.visualViewport;

    if (!vv) {
      root.style.setProperty("--vvh", "100dvh");
      root.style.setProperty("--vvt", "0px");
      return undefined;
    }

    const HEIGHT_THRESHOLD = 20;
    const OFFSET_THRESHOLD = 10;

    let lastH = Math.round(vv.height);
    let lastO = Math.round(vv.offsetTop);

    root.style.setProperty("--vvh", `${lastH}px`);
    root.style.setProperty("--vvt", `${lastO}px`);

    function update() {
      const h = Math.round(vv.height);
      const o = Math.round(vv.offsetTop);

      if (Math.abs(h - lastH) >= HEIGHT_THRESHOLD) {
        lastH = h;
        root.style.setProperty("--vvh", `${h}px`);
      }

      if (Math.abs(o - lastO) >= OFFSET_THRESHOLD) {
        lastO = o;
        root.style.setProperty("--vvt", `${o}px`);
      }
    }

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", () => {
      lastH = 0;
      lastO = 0;
      setTimeout(update, 100);
    });

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vvt");
    };
  }, []);
}
