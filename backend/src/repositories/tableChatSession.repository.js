import TableChatSession from "../models/TableChatSession.js";

const MAX_MESSAGES = 80;

export async function findSessionByToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== "string") return null;
  return TableChatSession.findOne({ sessionToken: sessionToken.trim() }).exec();
}

export async function findSessionByTableId(tableId) {
  return TableChatSession.findOne({ tableId }).exec();
}

export async function createSessionForTable({ sessionToken, tableId, restaurantId }) {
  return TableChatSession.create({
    sessionToken,
    tableId,
    restaurantId,
    messages: [],
    cart: { items: [], subtotal: 0, updatedAt: new Date() },
    lastActivityAt: new Date(),
  });
}

export async function listMessagesLean(sessionId) {
  const doc = await TableChatSession.findById(sessionId).select("messages").lean();
  return doc?.messages || [];
}

/**
 * @param {object} assistantDoc - content, optional menuRecommendations, suggestedActions, quickReplies
 */
export async function appendExchange(sessionMongoId, userText, assistantDoc) {
  const { content, menuRecommendations, suggestedActions, quickReplies } = assistantDoc;
  const assistantMsg = {
    role: "assistant",
    content,
    ...(Array.isArray(menuRecommendations) && menuRecommendations.length ? { menuRecommendations } : {}),
    ...(Array.isArray(suggestedActions) && suggestedActions.length ? { suggestedActions } : {}),
    ...(Array.isArray(quickReplies) && quickReplies.length ? { quickReplies } : {}),
  };
  await TableChatSession.findByIdAndUpdate(sessionMongoId, {
    $push: {
      messages: {
        $each: [{ role: "user", content: userText }, assistantMsg],
        $slice: -MAX_MESSAGES,
      },
    },
    $set: { lastActivityAt: new Date() },
  });
}

export async function deleteSessionsForTable(tableId) {
  await TableChatSession.deleteMany({ tableId });
}

export async function saveCart(sessionId, cart) {
  await TableChatSession.findByIdAndUpdate(sessionId, {
    $set: {
      cart: { ...cart, updatedAt: new Date() },
      lastActivityAt: new Date(),
    },
  });
}

export async function setActiveOrder(sessionId, orderId, status) {
  await TableChatSession.findByIdAndUpdate(sessionId, {
    $set: {
      activeOrderId: orderId,
      lastOrderStatus: status || "",
      lastActivityAt: new Date(),
    },
  });
}

export async function clearActiveOrder(sessionId) {
  await TableChatSession.findByIdAndUpdate(sessionId, {
    $set: {
      activeOrderId: null,
      lastOrderStatus: "",
      lastActivityAt: new Date(),
    },
  });
}

export async function countMessages(sessionId) {
  const d = await TableChatSession.findById(sessionId).select("messages").lean();
  return d?.messages?.length ?? 0;
}

/**
 * Wipes chat and bumps tableChatRevision so the guest app drops stale UI state.
 */
export async function clearAllMessagesAndBumpRevision(sessionId) {
  await TableChatSession.findByIdAndUpdate(sessionId, {
    $set: { messages: [], lastActivityAt: new Date() },
    $inc: { tableChatRevision: 1 },
  });
}

/**
 * Guest-initiated "new conversation": clear thread and cancel a pending auto-reset timer.
 */
export async function resetGuestTableConversation(sessionId) {
  await TableChatSession.findByIdAndUpdate(sessionId, {
    $set: {
      messages: [],
      pendingChatResetAt: null,
      pendingChatResetForOrder: null,
      lastActivityAt: new Date(),
    },
    $inc: { tableChatRevision: 1 },
  });
}
