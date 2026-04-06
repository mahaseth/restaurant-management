"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPublicAgent, sendPublicMessage, getPublicConversation } from "@/api/publicAiChat";
import { ChatThemeProvider } from "@/features/ai-chat/utils/ThemeProvider";
import { resolveTheme, getThinkingMessagesForStyle, isDiscountEnabled } from "@/features/ai-chat/utils/chatTheme";
import { useCouponRedemption } from "@/features/ai-chat/hooks/useCouponRedemption";
import { useSmartScroll } from "@/features/ai-chat/hooks/useSmartScroll";
import Background from "@/features/ai-chat/components/Background";
import LoadingScreen from "@/features/ai-chat/components/LoadingScreen";
import WelcomeScreen from "@/features/ai-chat/components/WelcomeScreen";
import ChatShell from "@/features/ai-chat/components/ChatShell";
import VoucherModal from "@/features/ai-chat/components/VoucherModal";
import { useVisualViewport } from "@/features/ai-chat/hooks/useVisualViewport";
import { useIsMobile } from "@/features/ai-chat/hooks/useIsMobile";

function createSessionId() {
  if (typeof window === "undefined") return "";
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function stripVoucherTag(content) {
  if (!content) return "";
  return content.replace(/\n?\[discount_voucher\]\s*$/i, "").trim();
}

function detectMobileClient() {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function PublicAiChatPage() {
  useVisualViewport();
  const params = useParams();
  const slug = params?.slug;
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeFading, setWelcomeFading] = useState(false);
  const [chatReady, setChatReady] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [theme, setTheme] = useState(() => resolveTheme(null, ""));

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);

  const sessionIdRef = useRef("");
  const { stage, requestEndChat, cancelToChat } = useCouponRedemption();

  const thinkingMessages = useMemo(
    () => getThinkingMessagesForStyle(theme.thinkingTextStyle).map((text) => ({ text })),
    [theme.thinkingTextStyle]
  );

  const { messagesContainerRef, scrollToBottom } = useSmartScroll(messages, thinking);

  useEffect(() => {
    sessionIdRef.current = createSessionId();
  }, []);

  useEffect(() => {
    if (!thinking) {
      setThinkingMessageIndex(0);
      return;
    }
    const id = setInterval(() => {
      setThinkingMessageIndex((i) => (i + 1) % Math.max(thinkingMessages.length, 1));
    }, 1800);
    return () => clearInterval(id);
  }, [thinking, thinkingMessages.length]);

  useEffect(() => {
    if (!slug) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timeouts = [];
    const schedule = (fn, ms) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    setLoading(true);
    setIsTransitioning(false);
    setShowWelcome(false);
    setWelcomeFading(false);
    setChatReady(false);
    setError(null);

    (async () => {
      try {
        const res = await getPublicAgent(String(slug));
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.error || "Not found");
          setLoading(false);
          return;
        }
        const d = res.data;
        setAgentName(d.agentName || "Assistant");
        setAvatarUrl(d.avatarUrl || null);
        setBackgroundImageUrl(d.backgroundImageUrl || null);
        setBarcodeUrl(d.barcodeUrl || null);
        const merged = resolveTheme(
          {
            ...(d.chatTheme || {}),
            discountEnabled:
              d.discountEnabled !== undefined && d.discountEnabled !== null
                ? d.discountEnabled
                : d.chatTheme?.discountEnabled,
          },
          d.agentName
        );
        setTheme(merged);

        let convoRes = { success: false };
        try {
          convoRes = await getPublicConversation(String(slug), sessionIdRef.current);
        } catch {
          convoRes = { success: false };
        }

        if (cancelled) return;
        if (convoRes?.success && convoRes.data?.messages?.length) {
          setMessages(
            convoRes.data.messages.map((m, i) => ({
              messageId: m.messageId ?? i,
              content: stripVoucherTag(m.content),
              isFromUser: m.isFromUser,
              ...(Array.isArray(m.menuRecommendations) && m.menuRecommendations.length
                ? { menuRecommendations: m.menuRecommendations }
                : {}),
            }))
          );
        }

        const mobile = detectMobileClient();
        const loadingMinMs = mobile ? 1800 : 2200;
        const loadingFadeMs = mobile ? 700 : 900;
        const welcomeMinMs = mobile ? 2400 : 3200;
        const welcomeFadeMs = mobile ? 600 : 800;

        schedule(() => {
          setIsTransitioning(true);
          schedule(() => {
            setLoading(false);
            setIsTransitioning(false);
            setShowWelcome(true);
            schedule(() => {
              setWelcomeFading(true);
              schedule(() => {
                setShowWelcome(false);
                setWelcomeFading(false);
                setMessages((prev) =>
                  prev.length
                    ? prev
                    : [
                        {
                          messageId: 1,
                          content: `${merged.introHeading || "Hi!"}\n\n${merged.introBody || ""}`.trim(),
                          isFromUser: false,
                        },
                      ]
                );
                setChatReady(true);
              }, welcomeFadeMs);
            }, welcomeMinMs);
          }, loadingFadeMs);
        }, loadingMinMs);
      } catch {
        if (!cancelled) {
          setError("Failed to load");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [slug]);

  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const text = messageInput.trim();
      if (!text || !slug || !sessionIdRef.current || sending) return;

      const userMsg = {
        messageId: Date.now(),
        content: text,
        isFromUser: true,
      };
      setMessages((prev) => [...prev, userMsg]);
      setMessageInput("");
      setSending(true);
      setThinking(true);
      setTimeout(() => scrollToBottom(true), 50);

      try {
        const res = await sendPublicMessage(String(slug), sessionIdRef.current, text);
        if (res.success && res.data?.assistantMessage) {
          const am = res.data.assistantMessage;
          const raw = am.content ?? "";
          setMessages((prev) => [
            ...prev,
            {
              messageId: am.messageId ?? Date.now() + 1,
              content: stripVoucherTag(raw),
              isFromUser: false,
              ...(Array.isArray(am.menuRecommendations) && am.menuRecommendations.length
                ? { menuRecommendations: am.menuRecommendations }
                : {}),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              messageId: Date.now() + 1,
              content: res.error || "No reply",
              isFromUser: false,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            messageId: Date.now() + 1,
            content: "Something went wrong. Try again.",
            isFromUser: false,
          },
        ]);
      } finally {
        setSending(false);
        setThinking(false);
        setTimeout(() => scrollToBottom(true), 50);
      }
    },
    [messageInput, slug, sending, scrollToBottom]
  );

  /** End Chat always opens the voucher / thank-you step (discount line only if enabled in theme). */
  const onEndChat = () => {
    requestEndChat();
  };

  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-100 to-slate-200/90 font-sans antialiased">
        <div className="max-w-sm w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <i className="pi pi-exclamation-circle text-2xl" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Chat unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ChatThemeProvider theme={theme}>
      {/* GPTA-style: fixed visual-viewport column; chat shell is full width with max-w-3xl content, not a 440px card */}
      <div
        className="fixed left-0 right-0 z-0 flex flex-col overflow-hidden"
        style={{
          top: "var(--vvt, 0px)",
          height: "var(--vvh, 100dvh)",
        }}
      >
        <Background chatReady={chatReady} backgroundImageUrl={backgroundImageUrl} />
        <LoadingScreen loading={loading} isTransitioning={isTransitioning} isMobile={isMobile} />
        {showWelcome && (
          <WelcomeScreen
            fading={welcomeFading}
            heading={theme.welcomeHeading}
            subtext={theme.welcomeSubtext}
            agentName={agentName}
            avatarUrl={avatarUrl}
            isMobile={isMobile}
          />
        )}
        {chatReady ? (
          <ChatShell
            agentName={agentName}
            avatarUrl={avatarUrl}
            messages={messages}
            thinking={thinking}
            thinkingText={thinkingMessages[thinkingMessageIndex]?.text || "…"}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={handleSend}
            sending={sending}
            endChatLabel={theme.endChatLabel}
            onEndChat={onEndChat}
            messagesContainerRef={messagesContainerRef}
            discountBanner={isDiscountEnabled(theme) ? theme.voucherBannerLabel : null}
          />
        ) : null}

        <VoucherModal
          open={stage === "voucher"}
          barcodeUrl={barcodeUrl}
          onViewFullscreen={() => {
            /* optional fullscreen image */
          }}
          onContinueChat={() => cancelToChat()}
          onEndSession={() => {
            cancelToChat();
            try {
              window.close();
            } catch {
              /* ignore */
            }
          }}
        />
      </div>
    </ChatThemeProvider>
  );
}
