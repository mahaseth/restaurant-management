import { findAgentBySlug } from "./services/provisionAgent.service.js";
import { resolveThemeForApi, normalizeDiscountEnabled } from "./services/chatBranding.service.js";
import { handleChatMessage } from "./services/restaurantChat.service.js";
import * as sessionStore from "./services/aiChatSession.store.js";

export async function getPublicAgent(req, res) {
  try {
    const slug = req.query.slug;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ success: false, error: "slug is required" });
    }

    const agent = await findAgentBySlug(slug.trim());
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

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
        /** Explicit flag so the guest app never misses voucher flow due to nested theme parsing. */
        discountEnabled,
        chatTheme: theme,
      },
    });
  } catch (e) {
    console.error("[publicAiChat] getPublicAgent", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

function toPublicMessages(sessionId) {
  const list = sessionStore.listMessages(sessionId);
  return list.map((m, index) => {
    const base = {
      messageId: index + 1,
      content: m.content,
      isFromUser: m.role === "user",
      sentAt: new Date().toISOString(),
    };
    if (m.role === "assistant" && Array.isArray(m.menuRecommendations) && m.menuRecommendations.length) {
      base.menuRecommendations = m.menuRecommendations;
    }
    return base;
  });
}

export async function getConversation(req, res) {
  try {
    const slug = req.query.slug;
    const sessionId = req.query.sessionId;
    if (!slug || !sessionId) {
      return res.status(400).json({ success: false, error: "slug and sessionId are required" });
    }

    const agent = await findAgentBySlug(String(slug).trim());
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const messages = toPublicMessages(sessionId);
    res.json({ success: true, data: { messages } });
  } catch (e) {
    console.error("[publicAiChat] getConversation", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function postMessage(req, res) {
  try {
    const { slug, sessionId, message } = req.body || {};
    if (!slug || !sessionId || message === undefined || message === null) {
      return res.status(400).json({ success: false, error: "slug, sessionId, and message are required" });
    }

    const text = String(message).trim();
    if (!text) return res.status(400).json({ success: false, error: "message is empty" });
    if (text.length > 4000) return res.status(400).json({ success: false, error: "message too long" });

    const agent = await findAgentBySlug(String(slug).trim());
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const result = await handleChatMessage(agent, text, String(sessionId));

    res.json({
      success: true,
      data: {
        assistantMessage: result.assistantMessage,
      },
    });
  } catch (e) {
    console.error("[publicAiChat] postMessage", e);
    res.status(500).json({
      success: false,
      error: e.message || "Chat failed",
    });
  }
}
