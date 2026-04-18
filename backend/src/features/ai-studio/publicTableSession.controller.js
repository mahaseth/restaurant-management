import Order from "../../models/Order.js";
import Table from "../../models/Table.js";
import { resolveThemeForApi, normalizeDiscountEnabled } from "./services/chatBranding.service.js";
import { handleChatMessage } from "./services/restaurantChat.service.js";
import {
  schedulePersistTableChatEvalTurn,
  inferSuccessHeuristic,
} from "./services/tableAssistantEval.service.js";
import { findAgentByRestaurantId } from "./services/provisionAgent.service.js";
import { getOrCreateSessionForQrToken } from "./services/tableChatSession.service.js";
import * as tableChatSessionRepo from "../../repositories/tableChatSession.repository.js";
import * as cartService from "./services/tableSessionCart.service.js";
import * as orderService from "./services/tableSessionOrder.service.js";
import { synchronizeTableChatRenewal } from "./services/tableSessionChatRenewal.service.js";

function toPublicMessages(messages) {
  return (messages || []).map((m, index) => {
    const base = {
      messageId: index + 1,
      content: m.content,
      isFromUser: m.role === "user",
      sentAt: new Date().toISOString(),
    };
    if (m.role === "assistant" && Array.isArray(m.menuRecommendations) && m.menuRecommendations.length) {
      base.menuRecommendations = m.menuRecommendations;
    }
    if (m.role === "assistant" && Array.isArray(m.suggestedActions) && m.suggestedActions.length) {
      base.suggestedActions = m.suggestedActions;
    }
    if (m.role === "assistant" && Array.isArray(m.quickReplies) && m.quickReplies.length) {
      base.quickReplies = m.quickReplies;
    }
    return base;
  });
}

async function loadSessionOnly(sessionToken) {
  const token = String(sessionToken || "").trim();
  if (!token) return null;
  return tableChatSessionRepo.findSessionByToken(token);
}

async function loadSessionWithAgent(sessionToken) {
  const session = await loadSessionOnly(sessionToken);
  if (!session) return null;
  const agent = await findAgentByRestaurantId(session.restaurantId);
  if (!agent || !agent.enabled) return null;
  return { session, agent };
}

export async function getQrSession(req, res) {
  try {
    const qrToken = req.params.qrToken;
    const { table, session } = await getOrCreateSessionForQrToken(qrToken);
    if (!table) {
      return res.status(404).json({ success: false, error: "Invalid or unknown table QR" });
    }
    if (!session) {
      return res.status(500).json({ success: false, error: "Could not start table session" });
    }

    const agent = await findAgentByRestaurantId(table.restaurantId);
    const agentAvailable = !!(agent && agent.enabled);

    res.json({
      success: true,
      data: {
        sessionToken: session.sessionToken,
        tableNumber: table.tableNumber,
        restaurantId: String(table.restaurantId),
        tableId: String(table._id),
        agentAvailable,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] getQrSession", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function getSessionState(req, res) {
  try {
    const session = await loadSessionOnly(req.params.sessionToken);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found. Scan the QR code on your table again.",
      });
    }

    if (session.activeOrderId) {
      const o = await Order.findById(session.activeOrderId).lean();
      if (o && o.status !== session.lastOrderStatus) {
        await tableChatSessionRepo.setActiveOrder(session._id, o._id, o.status);
        session.lastOrderStatus = o.status;
      }
      if (!o) {
        await tableChatSessionRepo.clearActiveOrder(session._id);
      }
    }

    const { publicRenewal } = await synchronizeTableChatRenewal(session.sessionToken);
    const liveSession =
      (await tableChatSessionRepo.findSessionByToken(session.sessionToken)) || session;

    const tableDoc = await Table.findById(liveSession.tableId).lean();
    const agent = await findAgentByRestaurantId(liveSession.restaurantId);
    const agentAvailable = !!(agent && agent.enabled);
    const cart = cartService.serializeCart(liveSession.cart);
    const orderBits = await orderService.getOrderStatusForSession(liveSession);

    res.json({
      success: true,
      data: {
        sessionToken: liveSession.sessionToken,
        tableId: String(liveSession.tableId),
        tableNumber: tableDoc?.tableNumber ?? null,
        restaurantId: String(liveSession.restaurantId),
        agentAvailable,
        cart,
        activeOrder: orderBits.activeOrder,
        orderGuestPhase: orderBits.guestPhase,
        lastOrderStatus: orderBits.lastOrderStatus,
        pendingChatResetAt: publicRenewal.pendingChatResetAt,
        tableChatRevision: publicRenewal.tableChatRevision,
        chatJustCleared: publicRenewal.chatJustCleared,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] getSessionState", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function getAgent(req, res) {
  try {
    const ctx = await loadSessionWithAgent(req.params.sessionToken);
    if (!ctx) {
      return res.status(404).json({
        success: false,
        error: "Chat is not available. You can still browse the menu and order from this session.",
      });
    }

    const { agent } = ctx;
    const restaurant = agent.restaurantId;
    const restaurantName = typeof restaurant === "object" && restaurant?.name ? restaurant.name : "";

    const theme = resolveThemeForApi(agent);
    if (!theme.brandName && restaurantName) theme.brandName = restaurantName;
    const discountEnabled = normalizeDiscountEnabled(theme.discountEnabled);
    theme.discountEnabled = discountEnabled;

    res.json({
      success: true,
      data: {
        agentName: agent.agentDisplayName || restaurantName || "Restaurant",
        agentType: "tabular",
        avatarUrl: agent.avatarUrl || null,
        backgroundImageUrl: agent.backgroundImageUrl || null,
        barcodeUrl: agent.voucherBarcodeUrl || null,
        discountEnabled,
        chatTheme: theme,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] getAgent", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function getConversation(req, res) {
  try {
    await synchronizeTableChatRenewal(req.params.sessionToken);
    const ctx = await loadSessionWithAgent(req.params.sessionToken);
    if (!ctx) {
      return res.status(404).json({
        success: false,
        error: "Chat is not available for this session.",
      });
    }

    const sessionFresh = (await tableChatSessionRepo.findSessionByToken(ctx.session.sessionToken)) || ctx.session;
    const messages = await tableChatSessionRepo.listMessagesLean(sessionFresh._id);
    res.json({
      success: true,
      data: {
        messages: toPublicMessages(messages),
        tableChatRevision: sessionFresh.tableChatRevision ?? 0,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] getConversation", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function postResetConversation(req, res) {
  try {
    await synchronizeTableChatRenewal(req.params.sessionToken);
    const session = await loadSessionOnly(req.params.sessionToken);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    const blocking = await orderService.getBlockingActiveOrder(session);
    if (blocking) {
      return res.status(409).json({
        success: false,
        error: "You have an order in progress. Start a new chat when that order is finished.",
      });
    }
    const n = await tableChatSessionRepo.countMessages(session._id);
    if (n === 0) {
      return res.status(400).json({ success: false, error: "No saved conversation to clear." });
    }
    await tableChatSessionRepo.resetGuestTableConversation(session._id);
    const fresh = await tableChatSessionRepo.findSessionByToken(req.params.sessionToken);
    res.json({
      success: true,
      data: {
        tableChatRevision: fresh?.tableChatRevision ?? 0,
        cleared: true,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] postResetConversation", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function postChatMessage(req, res) {
  try {
    await synchronizeTableChatRenewal(req.params.sessionToken);
    const { message } = req.body || {};
    if (message === undefined || message === null) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    const text = String(message).trim();
    if (!text) return res.status(400).json({ success: false, error: "message is empty" });
    if (text.length > 4000) return res.status(400).json({ success: false, error: "message too long" });

    const ctx = await loadSessionWithAgent(req.params.sessionToken);
    if (!ctx) {
      return res.status(403).json({
        success: false,
        error: "AI chat is not enabled for this restaurant.",
      });
    }

    const { session, agent } = ctx;

    const t0 = Date.now();
    const result = await handleChatMessage(agent, text, {
      listPriorTurns: async () => {
        const rows = await tableChatSessionRepo.listMessagesLean(session._id);
        return rows.map((m) => ({ role: m.role, content: m.content }));
      },
      persistExchange: async (userText, assistantPayload) => {
        await tableChatSessionRepo.appendExchange(session._id, userText, assistantPayload);
      },
    });
    const responseTimeMs = Date.now() - t0;

    const ret = result.retrieval;
    if (ret) {
      schedulePersistTableChatEvalTurn({
        restaurantId: session.restaurantId,
        tableId: session.tableId,
        sessionId: session._id,
        sessionToken: session.sessionToken,
        userQuery: text,
        retrievalQuery: typeof ret.retrievalQuery === "string" ? ret.retrievalQuery : text,
        queryIntent: ret.queryIntent && typeof ret.queryIntent === "object" ? ret.queryIntent : {},
        matchedMenuItems: Array.isArray(ret.matchedMenuItems) ? ret.matchedMenuItems : [],
        confidence: ret.confidence,
        fallbackUsed: !!ret.fallbackUsed,
        assistantMessage: result.assistantMessage?.content ?? "",
        responseTimeMs,
        topSimilarity: ret.topSimilarity != null && Number.isFinite(Number(ret.topSimilarity)) ? Number(ret.topSimilarity) : undefined,
        thresholdsUsed: ret.thresholdsUsed && typeof ret.thresholdsUsed === "object" ? ret.thresholdsUsed : undefined,
        successHeuristic: inferSuccessHeuristic({
          confidence: ret.confidence,
          fallbackUsed: !!ret.fallbackUsed,
        }),
      });
    }

    res.json({
      success: true,
      data: {
        assistantMessage: result.assistantMessage,
        retrieval: result.retrieval,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] postChatMessage", e);
    res.status(500).json({
      success: false,
      error: e.message || "Chat failed",
    });
  }
}

export async function getCart(req, res) {
  try {
    const cart = await cartService.getCart(req.params.sessionToken);
    if (cart === null) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    res.json({ success: true, data: { cart } });
  } catch (e) {
    console.error("[publicTableSession] getCart", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function postCartItem(req, res) {
  try {
    const cart = await cartService.addCartItem(req.params.sessionToken, req.body || {});
    if (cart === null) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    res.json({ success: true, data: { cart } });
  } catch (e) {
    console.error("[publicTableSession] postCartItem", e);
    res.status(400).json({ success: false, error: e.message || "Bad request" });
  }
}

export async function patchCartItem(req, res) {
  try {
    const { menuItemId } = req.params;
    const cart = await cartService.updateCartItemQuantity(req.params.sessionToken, menuItemId, req.body || {});
    if (cart === null) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    res.json({ success: true, data: { cart } });
  } catch (e) {
    console.error("[publicTableSession] patchCartItem", e);
    res.status(400).json({ success: false, error: e.message || "Bad request" });
  }
}

export async function deleteCartItem(req, res) {
  try {
    const { menuItemId } = req.params;
    const cart = await cartService.removeCartItem(req.params.sessionToken, menuItemId);
    if (cart === null) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    res.json({ success: true, data: { cart } });
  } catch (e) {
    console.error("[publicTableSession] deleteCartItem", e);
    res.status(400).json({ success: false, error: e.message || "Bad request" });
  }
}

export async function deleteCart(req, res) {
  try {
    const cart = await cartService.clearSessionCart(req.params.sessionToken);
    if (cart === null) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    res.json({ success: true, data: { cart } });
  } catch (e) {
    console.error("[publicTableSession] deleteCart", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function getOrderStatus(req, res) {
  try {
    const { publicRenewal } = await synchronizeTableChatRenewal(req.params.sessionToken);
    const session = await loadSessionOnly(req.params.sessionToken);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }
    const bits = await orderService.getOrderStatusForSession(session);
    res.json({
      success: true,
      data: {
        ...bits,
        pendingChatResetAt: publicRenewal.pendingChatResetAt,
        tableChatRevision: publicRenewal.tableChatRevision,
        chatJustCleared: publicRenewal.chatJustCleared,
      },
    });
  } catch (e) {
    console.error("[publicTableSession] getOrderStatus", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function postPlaceOrder(req, res) {
  try {
    const session = await loadSessionOnly(req.params.sessionToken);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }

    const { notes, customerEmail, clientOrderId, stripePaymentIntentId } = req.body || {};

    try {
      const order = await orderService.placeOrderFromSession(session, {
        notes,
        customerEmail,
        clientOrderId,
        stripePaymentIntentId,
        req,
      });
      const fresh = await Order.findById(order._id).lean();
      res.status(201).json({
        success: true,
        data: {
          order: orderService.serializeOrderForGuest(fresh),
        },
      });
    } catch (err) {
      if (err.code === "ACTIVE_ORDER_EXISTS" || err.message === "ACTIVE_ORDER_EXISTS") {
        return res.status(409).json({
          success: false,
          code: "ACTIVE_ORDER_EXISTS",
          error: "You already have an active order for this table. Check order status or wait until it is completed.",
          data: { order: err.order },
        });
      }
      if (err.message?.includes("not configured")) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (
        err.message?.includes("Payment") ||
        err.message?.includes("payment") ||
        err.message?.includes("Stripe")
      ) {
        return res.status(400).json({ success: false, error: err.message });
      }
      throw err;
    }
  } catch (e) {
    console.error("[publicTableSession] postPlaceOrder", e);
    res.status(400).json({
      success: false,
      error: e.message || "Could not place order",
    });
  }
}
