"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
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
  postTableSessionConversationReset,
} from "@/api/tableSession";
import { getPublicMenuItems } from "@/api/publicOrder";
import { ChatThemeProvider } from "@/features/ai-chat/utils/ThemeProvider";
import { resolveTheme, getThinkingMessagesForStyle, isDiscountEnabled } from "@/features/ai-chat/utils/chatTheme";
import { useSmartScroll } from "@/features/ai-chat/hooks/useSmartScroll";
import Background from "@/features/ai-chat/components/Background";
import ChatShell from "@/features/ai-chat/components/ChatShell";
import { useVisualViewport } from "@/features/ai-chat/hooks/useVisualViewport";
import { formatMoney } from "@/utils/formatMoney";
import { hexAlpha } from "@/features/ai-chat/utils/brandingPalette";
import TableSessionActionsFab from "../TableSessionActionsFab";

function stripVoucherTag(content) {
  if (!content) return "";
  return content.replace(/\n?\[discount_voucher\]\s*$/i, "").trim();
}

const PHASE_LABEL = {
  none: "No order yet",
  placed: "Order placed",
  preparing: "Preparing your order",
  ready: "Ready for you",
  completed: "Order completed",
};

const ORDER_STATUS_POLL_MS = 5000;

const WAITING_FOR_NEW_LABEL = "Waiting for new order";

/** eSewa: Wikimedia Commons — CC BY-SA. Khalti: Wikimedia Commons — CC BY-SA 4.0 (see file pages for attribution). */
const PAYMENT_BRAND_ICONS = {
  esewa:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Esewa_logo.webp/200px-Esewa_logo.webp",
  khalti:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Khalti_Digital_Wallet_Logo.png.jpg/200px-Khalti_Digital_Wallet_Logo.png.jpg",
};

const KITCHEN_STATUS_GUEST = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed by kitchen",
  IN_PROGRESS: "Being prepared",
  SERVED: "Ready at your table",
  CANCELLED: "Cancelled",
  BILLED: "Billed",
  CLOSED: "Closed",
};

/** Public menu: category order + display (matches `MenuItem.category` in API). */
const GUEST_MENU_CATEGORY_ORDER = ["appetizer", "main", "side", "dessert", "drink"];
const GUEST_MENU_CATEGORY_UI = {
  appetizer: { title: "Appetizers", emoji: "🥗" },
  main: { title: "Main course", emoji: "🥩" },
  side: { title: "Sides", emoji: "🍟" },
  dessert: { title: "Desserts", emoji: "🍰" },
  drink: { title: "Drinks", emoji: "🍹" },
  other: { title: "Menu", emoji: "📋" },
};

/**
 * @param {Array<{ _id: unknown, name?: string, category?: string, available?: boolean, description?: string }>} items
 * @returns {{ key: string, list: typeof items, title: string, emoji: string }[]}
 */
function groupTableMenuByCategory(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const by = new Map();
  for (const m of items) {
    const k = (typeof m?.category === "string" && m.category.trim() ? m.category : "other").toLowerCase();
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(m);
  }
  for (const list of by.values()) {
    list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" }));
  }
  const rank = (k) => {
    const i = GUEST_MENU_CATEGORY_ORDER.indexOf(k);
    return i < 0 ? 100 + k.charCodeAt(0) : i;
  };
  return [...by.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([key, list]) => {
      const meta = GUEST_MENU_CATEGORY_UI[key] || {
        title: key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        emoji: "📋",
      };
      return { key, list, title: meta.title, emoji: meta.emoji };
    });
}

function matchesGuestMenuQuery(m, q) {
  if (!q) return true;
  if (String(m?.name || "").toLowerCase().includes(q)) return true;
  if (String(m?.description || "").toLowerCase().includes(q)) return true;
  const cat = (m?.category && String(m.category).toLowerCase()) || "";
  if (cat && cat.includes(q)) return true;
  const ui = GUEST_MENU_CATEGORY_UI[cat];
  if (ui && String(ui.title).toLowerCase().includes(q)) return true;
  return false;
}

function normalizeOrderPhase(phase) {
  if (phase && Object.prototype.hasOwnProperty.call(PHASE_LABEL, phase)) return phase;
  return "none";
}

function formatMmSs(ms) {
  if (ms <= 0) return "0:00";
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [resettingChat, setResettingChat] = useState(false);
  const [chatRenewalTick, setChatRenewalTick] = useState(0);
  /** After a new conversation or server chat clear, table status shows "waiting" until a new in-progress order. */
  const [orderStatusAfterFreshChat, setOrderStatusAfterFreshChat] = useState(false);
  const lastTableChatRevRef = useRef(-1);
  const lastPendingKeyRef = useRef(null);
  const lastClearedKeyRef = useRef(null);

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

  const ingestOrderStatusPayload = useCallback((data) => {
    if (!data) return;
    if (data?.chatJustCleared) {
      setOrderStatusAfterFreshChat(true);
      const k = `${data.tableChatRevision ?? 0}-cleared`;
      if (lastClearedKeyRef.current !== k) {
        lastClearedKeyRef.current = k;
        toast.success("Fresh chat — you can start a new message anytime.", {
          autoClose: 5000,
          position: "top-center",
        });
      }
    }
    setSessionSnapshot((prev) =>
      prev
        ? {
            ...prev,
            activeOrder: data.activeOrder,
            orderGuestPhase: data.guestPhase,
            lastOrderStatus: data.lastOrderStatus,
            pendingChatResetAt: data.pendingChatResetAt ?? null,
            tableChatRevision: data.tableChatRevision ?? prev.tableChatRevision,
            chatJustCleared: data.chatJustCleared,
            ...(data.tableNumber !== undefined ? { tableNumber: data.tableNumber } : {}),
          }
        : prev
    );
  }, []);

  const reloadChatAfterServerClear = useCallback(async () => {
    if (!sessionToken) return;
    if (!agentAvailable) {
      setOrderStatusAfterFreshChat(true);
      setMessages([
        {
          messageId: 1,
          content:
            "AI chat is off for this venue right now. You can still browse the menu below, add items to your cart, and place your order.",
          isFromUser: false,
        },
      ]);
      setTimeout(() => scrollToBottom(true), 100);
      return;
    }
    const convoRes = await getTableSessionConversation(sessionToken);
    if (!convoRes?.success || !convoRes.data) return;
    if (convoRes.data.messages?.length) {
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
          ...(Array.isArray(m.quickReplies) && m.quickReplies.length ? { quickReplies: m.quickReplies } : {}),
        }))
      );
    } else {
      setMessages([
        {
          messageId: 1,
          content: `${theme.introHeading || "Hi!"}\n\n${theme.introBody || ""}`.trim(),
          isFromUser: false,
        },
      ]);
    }
    setOrderStatusAfterFreshChat(true);
    setTimeout(() => scrollToBottom(true), 100);
  }, [sessionToken, agentAvailable, theme.introHeading, theme.introBody, scrollToBottom]);

  useEffect(() => {
    const p = sessionSnapshot?.pendingChatResetAt;
    if (p && lastPendingKeyRef.current !== p) {
      lastPendingKeyRef.current = p;
      toast.info(
        "Your order is complete. This chat will start fresh in about 1 minute — a clean thread for your next time here.",
        { autoClose: 8000, position: "top-center" }
      );
    }
    if (!p) lastPendingKeyRef.current = null;
  }, [sessionSnapshot?.pendingChatResetAt]);

  useEffect(() => {
    const p = sessionSnapshot?.pendingChatResetAt;
    if (!p) return;
    const end = new Date(p).getTime();
    if (Date.now() >= end) return;
    const id = setInterval(() => setChatRenewalTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [sessionSnapshot?.pendingChatResetAt]);

  useEffect(() => {
    if (!sessionToken || !sessionSnapshot?.pendingChatResetAt) return;
    const id = setInterval(() => {
      void refreshSession();
    }, 3000);
    return () => clearInterval(id);
  }, [sessionToken, sessionSnapshot?.pendingChatResetAt, refreshSession]);

  useEffect(() => {
    const rev = sessionSnapshot?.tableChatRevision;
    if (rev == null) return;
    if (lastTableChatRevRef.current < 0) {
      lastTableChatRevRef.current = rev;
      return;
    }
    if (rev > lastTableChatRevRef.current) {
      lastTableChatRevRef.current = rev;
      void reloadChatAfterServerClear();
    }
  }, [sessionSnapshot?.tableChatRevision, reloadChatAfterServerClear]);

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
    const poll = () => {
      getTableSessionOrderStatus(sessionToken)
        .then((r) => {
          if (r.success && r.data) ingestOrderStatusPayload(r.data);
        })
        .catch(() => {});
    };
    void poll();
    const id = setInterval(poll, ORDER_STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [sessionToken, ingestOrderStatusPayload]);

  useEffect(() => {
    if (!sessionToken) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      getTableSessionOrderStatus(sessionToken)
        .then((r) => {
          if (r.success && r.data) ingestOrderStatusPayload(r.data);
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sessionToken, ingestOrderStatusPayload]);

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

  const onFabOpenCart = () => {
    setDrawerTab("cart");
    setCartOpen(true);
  };

  const filteredMenu = useMemo(() => {
    const all = menuItems.filter((m) => m.available !== false);
    const q = menuSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) => matchesGuestMenuQuery(m, q));
  }, [menuItems, menuSearch]);

  const menuSections = useMemo(() => groupTableMenuByCategory(filteredMenu), [filteredMenu]);

  const cart = sessionSnapshot?.cart;
  const activeOrder = sessionSnapshot?.activeOrder;
  const cartCount = cart?.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 0;
  const phase = useMemo(
    () => normalizeOrderPhase(sessionSnapshot?.orderGuestPhase),
    [sessionSnapshot?.orderGuestPhase]
  );
  const tableNumRaw = sessionSnapshot?.tableNumber;
  const tableNumDisplay = useMemo(() => {
    if (tableNumRaw === 0) return "0";
    if (tableNumRaw == null || tableNumRaw === "") return "—";
    if (typeof tableNumRaw === "number" && !Number.isNaN(tableNumRaw)) return String(tableNumRaw);
    return String(tableNumRaw).trim() || "—";
  }, [tableNumRaw]);

  const chatRenewalMsLeft = useMemo(() => {
    void chatRenewalTick;
    const p = sessionSnapshot?.pendingChatResetAt;
    if (!p) return 0;
    return Math.max(0, new Date(p).getTime() - Date.now());
  }, [sessionSnapshot?.pendingChatResetAt, chatRenewalTick]);

  useEffect(() => {
    const p = normalizeOrderPhase(sessionSnapshot?.orderGuestPhase);
    if (p === "placed" || p === "preparing" || p === "ready") {
      setOrderStatusAfterFreshChat(false);
    }
  }, [sessionSnapshot?.orderGuestPhase]);

  const inProgressOrder = phase === "placed" || phase === "preparing" || phase === "ready";
  const showWaitingForNewOrder = orderStatusAfterFreshChat && !inProgressOrder;
  const displayStatusLong = showWaitingForNewOrder
    ? WAITING_FOR_NEW_LABEL
    : PHASE_LABEL[phase] || PHASE_LABEL.none;
  const displayStatusAria = showWaitingForNewOrder
    ? `Table status: ${WAITING_FOR_NEW_LABEL}. Your conversation was cleared; you can start a new order.`
    : `Table status: ${PHASE_LABEL[phase] || PHASE_LABEL.none}. Updates in real time while you keep this page open.`;

  const guestOrderStatusPill = useMemo(() => {
    const shouldPing =
      showWaitingForNewOrder || (phase !== "none" && phase !== "completed");
    const dotClass = showWaitingForNewOrder
      ? "bg-indigo-400"
      : { none: "bg-slate-400", placed: "bg-sky-400", preparing: "bg-amber-400", ready: "bg-emerald-400", completed: "bg-violet-300" }[
          phase
        ] || "bg-slate-400";
    return (
      <div className="inline-flex min-w-0 max-w-full shrink-0 items-center justify-center self-center">
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={displayStatusAria}
          className="inline-flex w-auto max-w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-center shadow-none backdrop-blur-[2px] sm:gap-2.5 sm:px-4 sm:py-2"
          title="Status updates in real time while you keep this page open"
        >
          {shouldPing ? (
            <span
              className="relative flex h-2.5 w-2.5 shrink-0"
              style={{ minWidth: "0.6rem" }}
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/20 opacity-50" />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ring-1 ring-white/25 ${dotClass} shadow-sm`}
              />
            </span>
          ) : (
            <span
              className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/15 ${dotClass} shadow-sm`}
              aria-hidden
            />
          )}
          <span className="min-w-0 text-center text-sm font-medium leading-tight text-white/90 [overflow-wrap:anywhere] [text-wrap:balance] min-[400px]:whitespace-nowrap sm:text-base sm:font-semibold sm:leading-snug">
            {displayStatusLong}
          </span>
        </div>
      </div>
    );
  }, [displayStatusAria, displayStatusLong, phase, showWaitingForNewOrder]);

  const brandPrimary = theme?.primaryColor || "#6366f1";

  const orderBlocksNewChat = useMemo(
    () => Boolean(sessionSnapshot?.activeOrder && sessionSnapshot?.orderGuestPhase !== "completed"),
    [sessionSnapshot?.activeOrder, sessionSnapshot?.orderGuestPhase]
  );
  /** Show whenever there is on-screen thread content; use `newChatDisabled` when an order is in progress. */
  const showNewChatButton = chatReady && messages.length > 0;
  const newChatDisabled = orderBlocksNewChat || resettingChat;

  const showProceedToPay = Boolean(activeOrder && (activeOrder.paymentStatus === "PENDING" || !activeOrder.paymentStatus));
  const kitchenStatusLabel = activeOrder?.status ? KITCHEN_STATUS_GUEST[activeOrder.status] || activeOrder.status : "";

  const onChoosePaymentMethod = useCallback(
    (label) => {
      setPaymentDialogOpen(false);
      toast.info(`${label} — payment will open in a following update.`, { position: "top-center", autoClose: 3000 });
    },
    []
  );

  const handleNewConversation = useCallback(async () => {
    if (!sessionToken || resettingChat) return;
    if (orderBlocksNewChat || messages.length === 0) return;
    setResettingChat(true);
    try {
      if (!agentAvailable) {
        setOrderStatusAfterFreshChat(true);
        setMessages([
          {
            messageId: 1,
            content:
              "AI chat is off for this venue right now. You can still browse the menu below, add items to your cart, and place your order.",
            isFromUser: false,
          },
        ]);
        setMessageInput("");
        toast.info("New conversation");
        setTimeout(() => scrollToBottom(true), 100);
        return;
      }
      const res = await postTableSessionConversationReset(sessionToken);
      if (typeof res?.data?.tableChatRevision === "number") {
        lastTableChatRevRef.current = res.data.tableChatRevision;
      }
      await refreshSession();
      await reloadChatAfterServerClear();
      setMessageInput("");
      toast.info("New conversation — you can type a first message to begin again.");
    } catch (err) {
      const d = err?.response?.data;
      const em = d?.error || d?.message || "";
      if (String(em).toLowerCase().includes("no saved")) {
        await reloadChatAfterServerClear();
        setMessageInput("");
        toast.info("New conversation");
        return;
      }
      const message = em || "Could not start a new chat.";
      toast.error(message);
    } finally {
      setResettingChat(false);
    }
  }, [
    sessionToken,
    resettingChat,
    orderBlocksNewChat,
    messages.length,
    agentAvailable,
    refreshSession,
    reloadChatAfterServerClear,
    scrollToBottom,
  ]);

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
          {sessionSnapshot?.pendingChatResetAt && chatRenewalMsLeft > 0 ? (
            <div
              className="shrink-0 border-b border-indigo-100/80 bg-gradient-to-r from-indigo-50 via-violet-50/90 to-fuchsia-50/80 px-2 py-1.5 sm:px-3 sm:py-2"
              key={sessionSnapshot.pendingChatResetAt}
            >
              <div className="mx-auto flex max-w-3xl items-center justify-center gap-1.5 text-center sm:gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-indigo-500 sm:h-2 sm:w-2"
                  aria-hidden
                />
                <p className="text-[10px] font-medium leading-snug text-indigo-950 sm:text-xs">
                  Order complete — chat refreshes in{" "}
                  <span className="font-mono font-bold tabular-nums text-indigo-700">
                    {formatMmSs(chatRenewalMsLeft)}
                  </span>{" "}
                  for a new conversation with {agentName}.
                </p>
              </div>
            </div>
          ) : null}

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {chatReady ? (
              <>
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
                  onStartNewConversation={handleNewConversation}
                  showStartNewConversation={showNewChatButton}
                  startNewConversationDisabled={newChatDisabled}
                  startNewConversationLoading={resettingChat}
                  startNewConversationTitle={
                    orderBlocksNewChat
                      ? "New chat is available when your current order is finished (placed, preparing, or ready)"
                      : "Clear the thread and start fresh"
                  }
                  messagesContainerRef={messagesContainerRef}
                  discountBanner={isDiscountEnabled(theme) ? theme.voucherBannerLabel : null}
                  onAddRecommendationToCart={agentAvailable ? addRecToCart : null}
                  guestTableNumber={tableNumDisplay}
                  guestOrderStatusPill={guestOrderStatusPill}
                />
                <TableSessionActionsFab cartCount={cartCount} onOpenCart={onFabOpenCart} />
              </>
            ) : null}
          </div>
        </div>

        <Sidebar
          visible={cartOpen}
          position="right"
          onHide={() => setCartOpen(false)}
          showCloseIcon={false}
          blockScroll
          className="w-full max-w-md p-0 shadow-2xl shadow-slate-950/35 [&_.p-sidebar]:flex [&_.p-sidebar]:h-full [&_.p-sidebar]:min-h-0 [&_.p-sidebar]:!max-h-full [&_.p-sidebar]:flex-col [&_.p-sidebar]:!overflow-hidden [&_.p-sidebar]:!rounded-3xl [&_.p-sidebar]:!border-0 [&_.p-sidebar]:!ring-0 [&_.p-sidebar-header]:hidden [&_.p-sidebar-content]:!flex-1 [&_.p-sidebar-content]:!min-h-0 [&_.p-sidebar-content]:!p-0 [&_.p-sidebar-content]:!m-0 [&_.p-sidebar-content]:flex [&_.p-sidebar-content]:!flex-col"
          maskClassName="!bg-slate-950/50 !backdrop-blur-sm"
        >
          <div
            className="flex h-full min-h-0 flex-1 flex-col"
            style={{
              background: `linear-gradient(180deg, ${hexAlpha(brandPrimary, 0.1)} 0%, #f8fafc 26%, #e2e8f0 100%)`,
            }}
          >
            <div
              className="shrink-0 text-white"
              style={{
                background: `linear-gradient(145deg, ${brandPrimary} 0%, ${hexAlpha(brandPrimary, 0.7)} 100%)`,
                boxShadow: `0 10px 32px -12px ${hexAlpha(brandPrimary, 0.55)}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:pt-4">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-white/80">Order & menu</p>
                  <p
                    className="mt-1.5 max-w-[14rem] truncate text-lg font-bold leading-tight sm:max-w-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
                    {theme.brandName || agentName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close cart and menu"
                >
                  <i className="pi pi-times text-base" />
                </button>
              </div>
              <div className="px-3 pb-3.5 pt-3.5 sm:px-4 sm:pb-4" role="tablist" aria-label="Cart, menu, or your current order">
                <div className="flex min-h-0 gap-0.5 rounded-2xl bg-slate-950/25 p-0.5 ring-1 ring-white/15">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={drawerTab === "cart"}
                    onClick={() => setDrawerTab("cart")}
                    className={`relative flex min-h-0 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-[0.85rem] py-2 text-xs font-bold transition min-[400px]:gap-1.5 min-[400px]:py-2.5 min-[400px]:text-sm ${
                      drawerTab === "cart" ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
                    }`}
                  >
                    <i className="pi pi-shopping-cart min-[400px]:text-sm shrink-0 text-[0.7rem] opacity-80" />
                    <span className="min-w-0">Cart</span>
                    {cartCount > 0 && (
                      <span
                        className={`ml-0.5 min-w-[1.1rem] rounded-md px-1.5 text-[0.65rem] font-extrabold leading-none min-[400px]:text-[0.7rem] ${
                          drawerTab === "cart" ? "bg-slate-200 text-slate-800" : "bg-white/20 text-white"
                        }`}
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={drawerTab === "menu"}
                    onClick={() => setDrawerTab("menu")}
                    className={`flex min-h-0 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-[0.85rem] py-2 text-xs font-bold transition min-[400px]:gap-1.5 min-[400px]:py-2.5 min-[400px]:text-sm ${
                      drawerTab === "menu" ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
                    }`}
                  >
                    <i className="pi pi-list min-[400px]:text-sm shrink-0 text-[0.7rem] opacity-80" />
                    <span>Menu</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={drawerTab === "order"}
                    onClick={() => setDrawerTab("order")}
                    className={`relative flex min-h-0 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-[0.85rem] py-2 text-xs font-bold transition min-[400px]:gap-1.5 min-[400px]:py-2.5 min-[400px]:text-sm ${
                      drawerTab === "order" ? "bg-white text-slate-900 shadow-md" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {activeOrder ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 min-[400px]:-right-0.5 min-[400px]:-top-0.5 min-[400px]:h-2 min-[400px]:w-2 rounded-full border border-slate-950/10 bg-emerald-400"
                        title="You have a current order"
                        aria-hidden
                      />
                    ) : null}
                    <i className="pi pi-shopping-bag min-[400px]:text-sm shrink-0 text-[0.7rem] opacity-80" />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            </div>

            {drawerTab === "cart" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4" role="tabpanel">
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                  {!cart?.items?.length ? (
                    <div
                      className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-5 text-center"
                      style={{ borderColor: hexAlpha(brandPrimary, 0.35), background: hexAlpha(brandPrimary, 0.05) }}
                    >
                      <div
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/90 shadow-sm"
                        style={{ color: brandPrimary }}
                      >
                        <i className="pi pi-inbox text-xl" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Your cart is empty</p>
                      <p className="text-xs text-slate-500">
                        Open the <span className="font-semibold text-slate-700">Menu</span> tab to add dishes and
                        drinks.
                      </p>
                    </div>
                  ) : (
                    cart.items.map((it) => (
                      <div
                        key={it.menuItemId}
                        className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm ring-1 ring-slate-100/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm font-semibold leading-snug text-slate-900">{it.name}</p>
                          <p className="shrink-0 text-sm font-bold text-slate-700 tabular-nums">
                            {formatMoney(it.lineTotal)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            icon="pi pi-minus"
                            className="!h-8 !w-8 !p-0 p-button-sm p-button-outlined p-button-secondary"
                            onClick={() => setLineQty(it.menuItemId, (it.quantity || 1) - 1)}
                            aria-label="Decrease quantity"
                          />
                          <span className="min-w-[1.5rem] text-center text-sm font-bold text-slate-800 tabular-nums">
                            {it.quantity}
                          </span>
                          <Button
                            icon="pi pi-plus"
                            className="!h-8 !w-8 !p-0 p-button-sm p-button-outlined p-button-secondary"
                            onClick={() => setLineQty(it.menuItemId, (it.quantity || 1) + 1)}
                            aria-label="Increase quantity"
                          />
                          <Button
                            icon="pi pi-trash"
                            className="!ml-auto p-button-sm p-button-danger p-button-text"
                            onClick={() => removeLine(it.menuItemId)}
                            aria-label="Remove from cart"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <p
                    className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider"
                    style={{ color: "rgba(15, 23, 42, 0.55)" }}
                  >
                    Order notes (optional)
                  </p>
                  <InputTextarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    className="!w-full !rounded-2xl !border-slate-200/80 !p-2.5 !text-sm"
                    maxLength={500}
                  />
                </div>
                <p className="text-center text-xs leading-relaxed text-slate-500/95">
                  Cart subtotal is before tax. Your receipt total (including tax) is shown when you place the order.
                </p>
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/60 bg-white/50 px-3.5 py-2.5 backdrop-blur sm:px-4 sm:py-3">
                  <p className="min-w-0 text-sm font-bold text-slate-900">
                    Subtotal <span className="tabular-nums text-slate-800">{formatMoney(cart?.subtotal)}</span>
                  </p>
                  <Button
                    label="Place order"
                    icon="pi pi-check"
                    loading={placing}
                    disabled={!cart?.items?.length}
                    onClick={handlePlaceOrder}
                    className="!min-h-10 !rounded-full !border-0 !px-3.5 !text-sm !font-semibold !text-white min-[400px]:!px-4"
                    style={{
                      background: `linear-gradient(180deg, ${brandPrimary} 0%, ${hexAlpha(brandPrimary, 0.88)} 100%)`,
                      boxShadow: `0 4px 18px -4px ${hexAlpha(brandPrimary, 0.5)}`,
                      opacity: !cart?.items?.length ? 0.5 : 1,
                    }}
                  />
                </div>
                {phase !== "none" && phase !== "completed" && (
                  <div className="mt-0.5 flex items-start gap-2.5 rounded-2xl border border-amber-200/50 bg-amber-50/95 px-3 py-2.5 text-amber-950 shadow-sm sm:px-3.5">
                    <i className="pi pi-info-circle mt-0.5 flex-shrink-0 text-amber-500" />
                    <p className="text-xs leading-relaxed text-amber-900/90">
                      Active order: {PHASE_LABEL[phase]}. Add-ons may be limited until it is completed — use staff if
                      you need help.
                    </p>
                  </div>
                )}
              </div>
            ) : drawerTab === "menu" ? (
              <div
                className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-3.5 sm:p-4"
                id="table-session-menu-panel"
                role="tabpanel"
                aria-label="Menu"
              >
                <div className="relative">
                  <i
                    className="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400/90"
                    style={{ fontSize: "0.8rem" }}
                    aria-hidden
                  />
                  <input
                    className="w-full rounded-2xl border border-slate-200/80 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-offset-0"
                    style={{ "--tw-ring-color": hexAlpha(brandPrimary, 0.38) }}
                    placeholder="Search the menu…"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    aria-label="Search menu"
                  />
                </div>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden pr-0.5">
                  {menuSearch.trim() && menuSections.length === 0 ? (
                    <p className="px-0.5 py-6 text-center text-sm text-slate-500">
                      No dishes match <span className="font-medium text-slate-700">“{menuSearch.trim()}”</span>. Try
                      another word or a category (e.g. drink, main).
                    </p>
                  ) : !menuSearch.trim() && menuSections.length === 0 ? (
                    <p className="px-0.5 py-6 text-center text-sm text-slate-500">
                      No menu items are available for this session yet. Please check with the restaurant.
                    </p>
                  ) : (
                    menuSections.map((section) => (
                      <section
                        key={section.key}
                        className="space-y-2.5 sm:space-y-3"
                        aria-labelledby={`table-menu-cat-${section.key}`}
                      >
                        <div
                          className="sticky top-0 z-10 -mx-0.5 border-b border-slate-200/80 bg-slate-50/95 px-0.5 pb-1.5 pt-0.5 shadow-[0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-sm"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="flex items-end justify-between gap-2">
                            <h3
                              id={`table-menu-cat-${section.key}`}
                              className="m-0 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500"
                            >
                              <span className="mr-1" aria-hidden>
                                {section.emoji}
                              </span>
                              {section.title}
                            </h3>
                            <span className="shrink-0 text-[0.7rem] font-medium tabular-nums text-slate-400">
                              {section.list.length} {section.list.length === 1 ? "dish" : "dishes"}
                            </span>
                          </div>
                        </div>
                        <ul className="m-0 list-none space-y-2.5 p-0 sm:space-y-3" role="list">
                          {section.list.map((m) => (
                            <li
                              key={m._id}
                              className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-white/85 p-2.5 shadow-sm transition hover:border-slate-300/90 hover:shadow"
                            >
                              <div className="min-w-0 pl-0.5">
                                <p className="text-sm font-semibold leading-tight text-slate-900">{m.name}</p>
                                {m.description && String(m.description).trim() ? (
                                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                    {m.description}
                                  </p>
                                ) : null}
                                <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-500">
                                  {formatMoney(m.price)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                label="Add"
                                className="!h-8 !shrink-0 !rounded-full !self-center !px-2.5 !text-xs !font-bold sm:!h-8 sm:!px-3"
                                style={{
                                  color: "white",
                                  background: `linear-gradient(180deg, ${hexAlpha(brandPrimary, 1)} 0%, ${hexAlpha(brandPrimary, 0.9)} 100%)`,
                                  border: "none",
                                  boxShadow: `0 2px 10px -2px ${hexAlpha(brandPrimary, 0.4)}`,
                                }}
                                onClick={() => addMenuItemToCart(m)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4"
                role="tabpanel"
                aria-label="Current order and payment"
              >
                {activeOrder ? (
                  <>
                    <div
                      className="rounded-2xl border p-3.5 shadow-sm sm:p-4"
                      style={{ borderColor: hexAlpha(brandPrimary, 0.25), background: hexAlpha(brandPrimary, 0.04) }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-500">
                            Current order
                          </p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 sm:text-base">
                            #{String(activeOrder.orderNumber || "—").trim()}
                          </p>
                        </div>
                        <div className="flex min-w-0 max-w-[58%] flex-col items-end gap-1.5 sm:max-w-[55%]">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-0.5 text-center text-xs font-bold text-slate-800"
                            title="Kitchen / service status"
                          >
                            <i className="pi pi-clock text-[0.7rem] text-amber-600" aria-hidden />
                            <span className="leading-tight">{PHASE_LABEL[phase] || displayStatusLong}</span>
                          </span>
                          {activeOrder.status ? (
                            <p className="text-right text-[0.7rem] leading-tight text-slate-500">{kitchenStatusLabel}</p>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Payment:{" "}
                        <span className="font-semibold text-slate-800">
                          {activeOrder.paymentStatus === "PAID" || activeOrder.paidAt ? "Paid" : "Pending"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p
                        className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-wider"
                        style={{ color: "rgba(15, 23, 42, 0.5)" }}
                      >
                        Order items
                      </p>
                      <ul className="space-y-2">
                        {(Array.isArray(activeOrder.items) ? activeOrder.items : []).map((line, i) => (
                          <li
                            key={line?.productId ? String(line.productId) + i : `line-${i}`}
                            className="flex items-baseline justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2"
                          >
                            <span className="min-w-0 text-sm font-medium text-slate-900">
                              {line.name}{" "}
                              <span className="whitespace-nowrap text-slate-500">× {line.quantity || 0}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                              {formatMoney(line.lineTotal ?? (Number(line.unitPrice) * Number(line.quantity) || 0))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto space-y-2.5 border-t border-slate-200/60 pt-3 sm:pt-4">
                      <div className="flex flex-col gap-0.5 text-right sm:flex-row sm:items-end sm:justify-between sm:text-left sm:text-slate-700">
                        {activeOrder.subtotal != null && (
                          <p className="text-xs sm:text-left">
                            Subtotal <span className="font-semibold tabular-nums">{formatMoney(activeOrder.subtotal)}</span>
                          </p>
                        )}
                        {Number(activeOrder.tax) > 0 && (
                          <p className="text-xs text-slate-500 sm:text-left">Tax {formatMoney(activeOrder.tax)}</p>
                        )}
                        <p className="ml-auto w-full text-base font-bold text-slate-900 sm:ml-0 sm:w-auto">
                          Total <span className="tabular-nums">{formatMoney(activeOrder.total)}</span>
                        </p>
                      </div>
                      {showProceedToPay ? (
                        <Button
                          type="button"
                          label="Proceed to payment"
                          icon="pi pi-credit-card"
                          className="!w-full !rounded-2xl !border-0 !py-2.5 !text-sm !font-bold !text-white"
                          onClick={() => setPaymentDialogOpen(true)}
                          style={{
                            background: `linear-gradient(180deg, ${hexAlpha(brandPrimary, 1)} 0%, ${hexAlpha(brandPrimary, 0.88)} 100%)`,
                            boxShadow: `0 4px 18px -4px ${hexAlpha(brandPrimary, 0.5)}`,
                          }}
                        />
                      ) : (
                        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-3.5 py-2.5 text-center text-sm font-semibold text-emerald-900">
                          <i className="pi pi-check-circle mb-0.5 mr-1.5" aria-hidden />
                          {activeOrder.paymentStatus === "PAID" || activeOrder.paidAt
                            ? "This order is already paid. Thank you!"
                            : "No payment is due on this order right now."}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center"
                    style={{ borderColor: hexAlpha(brandPrimary, 0.3), background: hexAlpha(brandPrimary, 0.04) }}
                  >
                    <i className="pi pi-inbox text-2xl" style={{ color: brandPrimary }} />
                    <p className="text-sm font-semibold text-slate-800">No active order</p>
                    <p className="max-w-[16rem] text-xs text-slate-500">
                      Add items in <span className="font-semibold text-slate-700">Cart</span> and place an order to see
                      it here. Status and payment will appear in this tab.
                    </p>
                  </div>
                )}
              </div>
            )}
            <Dialog
              header="How would you like to pay?"
              visible={paymentDialogOpen}
              onHide={() => setPaymentDialogOpen(false)}
              className="w-full max-w-md"
              contentClassName="!p-0 !pt-0"
              draggable={false}
              resizable={false}
              blockScroll
              closable
              closeOnEscape
            >
              <div className="px-3 pb-2 sm:px-4 sm:pb-1">
                <p className="text-sm text-slate-600">
                  Choose a payment method. A secure session will be added in a later update. Logos: Wikimedia Commons
                  (eSewa, Khalti).
                </p>
              </div>
              <div className="flex flex-col gap-2.5 px-2 pb-2 sm:gap-3 sm:px-3 sm:pb-3">
                <button
                  type="button"
                  onClick={() => onChoosePaymentMethod("eSewa")}
                  className="group flex w-full min-h-[3.5rem] items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-0.5">
                    <img
                      src={PAYMENT_BRAND_ICONS.esewa}
                      alt=""
                      width={40}
                      height={40}
                      className="h-9 w-9 object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">eSewa</p>
                    <p className="text-xs text-slate-500">Pay with eSewa mobile wallet (Nepal)</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onChoosePaymentMethod("Khalti")}
                  className="group flex w-full min-h-[3.5rem] items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-0.5">
                    <img
                      src={PAYMENT_BRAND_ICONS.khalti}
                      alt=""
                      width={40}
                      height={40}
                      className="h-9 w-9 object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Khalti</p>
                    <p className="text-xs text-slate-500">Pay with Khalti digital wallet (Nepal)</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onChoosePaymentMethod("Card")}
                  className="group flex w-full min-h-[3.5rem] items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200/90">
                    <i className="pi pi-credit-card text-2xl text-slate-700" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Card & bank details</p>
                    <p className="text-xs text-slate-500">Debit / credit or bank (session coming soon)</p>
                  </div>
                </button>
              </div>
            </Dialog>
          </div>
        </Sidebar>
      </div>
    </ChatThemeProvider>
  );
}
