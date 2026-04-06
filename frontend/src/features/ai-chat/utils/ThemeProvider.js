"use client";

import React, { createContext, useContext } from "react";

const ChatThemeContext = createContext(null);

export function ChatThemeProvider({ theme, children }) {
  return <ChatThemeContext.Provider value={theme}>{children}</ChatThemeContext.Provider>;
}

export function useChatTheme() {
  const t = useContext(ChatThemeContext);
  if (!t) {
    throw new Error("useChatTheme must be used within ChatThemeProvider");
  }
  return t;
}
