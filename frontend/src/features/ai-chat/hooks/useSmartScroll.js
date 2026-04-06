"use client";

import { useEffect, useRef } from "react";

export function useSmartScroll(messages, thinking) {
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const isScrollingRef = useRef(false);

  const scrollToBottom = (force) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (force || shouldAutoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, thinking]);

  return {
    messagesContainerRef,
    scrollToBottom,
    showScrollToBottom: false,
    shouldAutoScrollRef,
    isScrollingRef,
  };
}
