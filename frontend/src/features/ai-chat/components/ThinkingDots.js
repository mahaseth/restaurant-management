"use client";

import { useChatTheme } from "../utils/ThemeProvider";

export default function ThinkingDots() {
  const theme = useChatTheme();
  const c = theme.primaryColor || "#2563eb";

  return (
    <span className="inline-flex items-center gap-1 pl-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: c,
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.9s",
          }}
        />
      ))}
    </span>
  );
}
