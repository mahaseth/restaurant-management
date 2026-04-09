"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputTextarea } from "primereact/inputtextarea";
import {
  getTableSessionState,
  getTableSessionAgent,
  getTableSessionConversation,
  sendTableSessionChatMessage,
  postTableSessionCartItem,
  patchTableSessionCartItem,
  deleteTableSessionCartItem,
  placeTableSessionOrder,
  getTableSessionOrderStatus,
} from "@/api/tableSession";
import { getPublicMenuItems } from "@/api/publicOrder";
import { ChatThemeProvider } from "@/features/ai-chat/utils/ThemeProvider";
import { resolveTheme, getThinkingMessagesForStyle, isDiscountEnabled } from "@/features/ai-chat/utils/chatTheme";
import { useCouponRedemption } from "@/features/ai-chat/hooks/useCouponRedemption";
import { useSmartScroll } from "@/features/ai-chat/hooks/useSmartScroll";
import Background from "@/features/ai-chat/components/Background";
import ChatShell from "@/features/ai-chat/components/ChatShell";
import VoucherModal from "@/features/ai-chat/components/VoucherModal";
import { useVisualViewport } from "@/features/ai-chat/hooks/useVisualViewport";

function stripVoucherTag(content) {
  if (!content) return "";
  return content.replace(/\n?\[discount_voucher\]\s*$/i, "").trim();
}

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

const PHASE_LABEL = {
  none: "No active order",
  placed: "Order placed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

export default function UnifiedTableSessionPage() {
  useVisualViewport();
  const params = useParams();
  const sessionToken = params?.sessionToken ? decodeURIComponent(String(params.sessionToken)) : "";
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionSnapshot, setSessionSnapshot] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const [agentName, setAgentName] = useState("Assistant");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [theme, setTheme] = useState(() => resolveTheme(null, ""));
  const [chatReady, setChatReady] = useState(false);
  const [agentAvailable, setAgentAvailable] = useState(false);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);

  const [cartOpen, setCartOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("cart");
  const [menuSearch, setMenuSearch] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const { stage, requestEndChat, cancelToChat } = useCouponRedemption();

  const thinkingMessages = useMemo(
    () => getThinkingMessagesForStyle(theme.thinkingTextStyle).map((text) => ({ text })),
    [theme.thinkingTextStyle]
  );

  const { messagesContainerRef, scrollToBottom } = useSmartScroll(messages, thinking);

  const refreshSession = useCallback(async () => {
    if (!sessionToken) return;
    const res = await getTableSessionState(sessionToken);
    if (res.success && res.data) setSessionSnapshot(res.data);
  }, [sessionToken]);

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
    if (!sessionToken) {
      setError("Invalid session");
      setBootLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stateRes = await getTableSessionState(sessionToken);
        if (cancelled) return;
        if (!stateRes.success || !stateRes.data) {
          setError(stateRes.error || "Session not found");
          setBootLoading(false);
          return;
        }
        setSessionSnapshot(stateRes.data);
        const aa = !!stateRes.data.agentAvailable;
        setAgentAvailable(aa);

        const menu = await getPublicMenuItems(stateRes.data.restaurantId);
        if (!cancelled) setMenuItems(Array.isArray(menu) ? menu : []);

        if (aa) {
          const [agentRes, convoRes] = await Promise.all([
            getTableSessionAgent(sessionToken),
            getTableSessionConversation(sessionToken),
          ]);
          if (cancelled) return;
          if (agentRes.success && agentRes.data) {
            const d = agentRes.data;
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
          }
          if (convoRes?.success && convoRes.data?.messages?.length) {
            setMessages(
              convoRes.data.messages.map((m, i) => ({
                messageId: m.messageId ?? i,
                content: stripVoucherTag(m.content),
                isFromUser: m.isFromUser,
                ...(Array.isArray(m.menuRecommendations) && m.menuRecommendations.length
                  ? { menuRecommendations: m.menuRecommendations }
                  : {}),
                ...(Array.isArray(m.suggestedActions) && m.suggestedActions.length
                  ? { suggestedActions: m.suggestedActions }
                  : {}),
                ...(Array.isArray(m.quickReplies) && m.quickReplies.length
                  ? { quickReplies: m.quickReplies }
                  : {}),
              }))
            );
          } else if (agentRes.success && agentRes.data) {
            const merged = resolveTheme(
              {
                ...(agentRes.data.chatTheme || {}),
                discountEnabled: agentRes.data.discountEnabled,
              },
              agentRes.data.agentName
            );
            setMessages([
              {
                messageId: 1,
                content: `${merged.introHeading || "Hi!"}\n\n${merged.introBody || ""}`.trim(),
                isFromUser: false,
              },
            ]);
          }
        } else {
          setTheme(resolveTheme(null, "Menu"));
          setMessages([
            {
              messageId: 1,
              content:
                "AI chat is off for this venue right now. You can still browse the menu below, add items to your cart, and place your order.",
              isFromUser: false,
            },
          ]);
        }
        setChatReady(true);
      } catch {
        if (!cancelled) setError("Failed to load");
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) return;
    const id = setInterval(() => {
      getTableSessionOrderStatus(sessionToken)
        .then((r) => {
          if (r.success && r.data) {
            setSessionSnapshot((prev) =>
              prev
                ? {
                    ...prev,
                    activeOrder: r.data.activeOrder,
                    orderGuestPhase: r.data.guestPhase,
                    lastOrderStatus: r.data.lastOrderStatus,
                  }
                : prev
            );
          }
        })
        .catch(() => {});
    }, 12000);
    return () => clearInterval(id);
  }, [sessionToken]);

  const lastQuickActions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.isFromUser && Array.isArray(m.suggestedActions) && m.suggestedActions.length) {
        return m.suggestedActions;
      }
    }
    return [];
  }, [messages]);

  const lastQuickReplies = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.isFromUser && Array.isArray(m.quickReplies) && m.quickReplies.length) {
        return m.quickReplies;
      }
    }
    return [];
  }, [messages]);

  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const text = messageInput.trim();
      if (!text || !sessionToken || !agentAvailable || sending) return;

      const userMsg = { messageId: Date.now(), content: text, isFromUser: true };
      setMessages((prev) => [...prev, userMsg]);
      setMessageInput("");
      setSending(true);
      setThinking(true);
      setTimeout(() => scrollToBottom(true), 50);

      try {
        const res = await sendTableSessionChatMessage(sessionToken, text);
        if (res.success && res.data?.assistantMessage) {
          const am = res.data.assistantMessage;
          setMessages((prev) => [
            ...prev,
            {
              messageId: am.messageId ?? Date.now() + 1,
              content: stripVoucherTag(am.content ?? ""),
              isFromUser: false,
              ...(Array.isArray(am.menuRecommendations) && am.menuRecommendations.length
                ? { menuRecommendations: am.menuRecommendations }
                : {}),
              ...(Array.isArray(am.suggestedActions) && am.suggestedActions.length
                ? { suggestedActions: am.suggestedActions }
                : {}),
              ...(Array.isArray(am.quickReplies) && am.quickReplies.length
                ? { quickReplies: am.quickReplies }
                : {}),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { messageId: Date.now() + 1, content: res.error || "No reply", isFromUser: false },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { messageId: Date.now() + 1, content: "Something went wrong. Try again.", isFromUser: false },
        ]);
      } finally {
        setSending(false);
        setThinking(false);
        setTimeout(() => scrollToBottom(true), 50);
      }
    },
    [messageInput, sessionToken, agentAvailable, sending, scrollToBottom]
  );

  const addRecToCart = useCallback(
    async (it) => {
      if (!sessionToken || !it?.menuItemId) return;
      try {
        const res = await postTableSessionCartItem(sessionToken, { menuItemId: it.menuItemId, quantity: 1 });
        if (res.success && res.data?.cart) {
          setSessionSnapshot((prev) => (prev ? { ...prev, cart: res.data.cart } : prev));
          toast.success("Added to cart");
        } else toast.error(res.error || "Could not add");
      } catch (err) {
        toast.error(err?.response?.data?.error || err?.message || "Could not add");
      }
    },
    [sessionToken]
  );

  const addMenuItemToCart = useCallback(
    async (item) => {
      if (!item?._id) return;
      await addRecToCart({ menuItemId: item._id, name: item.name, price: item.price });
    },
    [addRecToCart]
  );

  const setLineQty = async (menuItemId, qty) => {
    try {
      const res = await patchTableSessionCartItem(sessionToken, menuItemId, { quantity: qty });
      if (res.success && res.data?.cart) {
        setSessionSnapshot((prev) => (prev ? { ...prev, cart: res.data.cart } : prev));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed");
    }
  };

  const removeLine = async (menuItemId) => {
    try {
      const res = await deleteTableSessionCartItem(sessionToken, menuItemId);
      if (res.success && res.data?.cart) {
        setSessionSnapshot((prev) => (prev ? { ...prev, cart: res.data.cart } : prev));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Remove failed");
    }
  };

  const handlePlaceOrder = async () => {
    if (!sessionToken) return;
    setPlacing(true);
    try {
      const clientOrderId =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `co-${Date.now()}`;
      const res = await placeTableSessionOrder(sessionToken, {
        notes: orderNotes,
        clientOrderId,
      });
      if (res.success && res.data?.order) {
        toast.success(`Order ${res.data.order.orderNumber} placed`);
        setOrderNotes("");
        await refreshSession();
        setCartOpen(false);
      } else {
        toast.error(res.error || "Order failed");
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d?.code === "ACTIVE_ORDER_EXISTS") {
        toast.error(d.error || "You already have an active order");
        await refreshSession();
      } else {
        toast.error(d?.error || err?.message || "Order failed");
      }
    } finally {
      setPlacing(false);
    }
  };

  const runQuickAction = (action) => {
    const a = action?.action;
    if (a === "VIEW_CART") setCartOpen(true);
    if (a === "PLACE_ORDER") {
      setDrawerTab("cart");
      setCartOpen(true);
    }
    if (a === "ORDER_STATUS") {
      toast.info(PHASE_LABEL[sessionSnapshot?.orderGuestPhase] || "No active order");
    }
    if (a === "FOCUS_RECOMMENDATIONS") {
      const el = messagesContainerRef.current?.querySelector?.("[data-menu-recs]");
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
  };

  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return menuItems.filter((m) => m.available !== false);
    return menuItems.filter((m) => m.available !== false && String(m.name || "").toLowerCase().includes(q));
  }, [menuItems, menuSearch]);

  const cart = sessionSnapshot?.cart;
  const cartCount = cart?.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 0;
  const phase = sessionSnapshot?.orderGuestPhase || "none";

  if (error && !bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-3xl bg-white shadow-xl px-8 py-10 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Session unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="pi pi-spin pi-spinner text-3xl text-indigo-500" />
      </div>
    );
  }

  return (
    <ChatThemeProvider theme={theme}>
      <div
        className="fixed inset-x-0 z-0 flex flex-col overflow-hidden bg-slate-100"
        style={{
          top: "var(--vvt, 0px)",
          height: "var(--vvh, 100dvh)",
        }}
      >
        <Background chatReady={chatReady} backgroundImageUrl={backgroundImageUrl} />

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  Table {sessionSnapshot?.tableNumber ?? "—"}
                </p>
                <p className="truncate text-xs text-slate-500">{PHASE_LABEL[phase] || PHASE_LABEL.none}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  icon="pi pi-shopping-cart"
                  label={cartCount ? `Cart (${cartCount})` : "Cart"}
                  className="p-button-outlined p-button-sm"
                  onClick={() => {
                    setDrawerTab("cart");
                    setCartOpen(true);
                  }}
                />
              </div>
            </div>
          </header>

          {lastQuickActions.length > 0 && agentAvailable ? (
            <div className="shrink-0 border-b border-slate-200/60 bg-white/90 px-3 py-2">
              <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1">
                {lastQuickActions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => runQuickAction(a)}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {lastQuickReplies.length > 0 && agentAvailable ? (
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/90 px-3 py-2">
              <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto">
                {lastQuickReplies.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setMessageInput(q.prompt);
                    }}
                    className="shrink-0 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-medium text-indigo-900"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
                composerDisabled={!agentAvailable}
                endChatLabel={theme.endChatLabel}
                onEndChat={() => requestEndChat()}
                messagesContainerRef={messagesContainerRef}
                discountBanner={isDiscountEnabled(theme) ? theme.voucherBannerLabel : null}
                onAddRecommendationToCart={agentAvailable ? addRecToCart : null}
              />
            ) : null}
          </div>
        </div>

        <Sidebar visible={cartOpen} position="right" onHide={() => setCartOpen(false)} className="w-full max-w-md">
          <div className="flex h-full flex-col gap-4 p-2">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${drawerTab === "cart" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
                onClick={() => setDrawerTab("cart")}
              >
                Cart
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${drawerTab === "menu" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
                onClick={() => setDrawerTab("menu")}
              >
                Menu
              </button>
            </div>

            {drawerTab === "cart" ? (
              <>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                  {!cart?.items?.length ? (
                    <p className="text-sm text-slate-500">Cart is empty.</p>
                  ) : (
                    cart.items.map((it) => (
                      <div
                        key={it.menuItemId}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex justify-between gap-2">
                          <p className="font-semibold text-slate-900">{it.name}</p>
                          <p className="text-sm font-medium text-slate-600">{formatMoney(it.lineTotal)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            icon="pi pi-minus"
                            className="p-button-sm p-button-outlined"
                            onClick={() => setLineQty(it.menuItemId, (it.quantity || 1) - 1)}
                          />
                          <span className="w-8 text-center font-semibold">{it.quantity}</span>
                          <Button
                            icon="pi pi-plus"
                            className="p-button-sm p-button-outlined"
                            onClick={() => setLineQty(it.menuItemId, (it.quantity || 1) + 1)}
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-sm p-button-danger p-button-text ml-auto"
                            onClick={() => removeLine(it.menuItemId)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Order notes (optional)</p>
                  <InputTextarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    className="w-full"
                    maxLength={500}
                  />
                </div>
                <p className="text-xs text-slate-500">Cart subtotal before tax. Tax is included in the total when you place the order.</p>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <p className="text-sm font-bold text-slate-900">Subtotal {formatMoney(cart?.subtotal)}</p>
                  <Button
                    label="Place order"
                    icon="pi pi-check"
                    loading={placing}
                    disabled={!cart?.items?.length}
                    onClick={handlePlaceOrder}
                    className="p-button-sm"
                  />
                </div>
                {phase !== "none" && phase !== "completed" && (
                  <p className="text-xs text-amber-800">
                    Active order: {PHASE_LABEL[phase]}. Add-ons may be limited until it is completed — use staff if you
                    need help.
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Search menu…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {filteredMenu.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                        <p className="text-xs text-slate-500">{formatMoney(m.price)}</p>
                      </div>
                      <Button label="Add" className="p-button-sm" onClick={() => addMenuItemToCart(m)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Sidebar>

        <VoucherModal
          open={stage === "voucher"}
          barcodeUrl={barcodeUrl}
          onViewFullscreen={() => {}}
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
