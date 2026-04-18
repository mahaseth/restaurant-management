import Order from "../../../models/Order.js";
import TableChatSession from "../../../models/TableChatSession.js";
import * as tableChatSessionRepo from "../../../repositories/tableChatSession.repository.js";
import { mapGuestOrderPhase } from "./tableSessionOrder.service.js";

/** Time before clearing the in-memory chat after a paid or completed order (so the guest can read the last replies). */
export const CHAT_RENEWAL_DELAY_MS = 60_000;

function orderQualifiesForChatRenewal(order) {
  if (!order) return false;
  if (order.paymentStatus === "PAID") return true;
  if (mapGuestOrderPhase(order.status) === "completed") return true;
  return false;
}

/**
 * @returns {Promise<{
 *   session: import("mongoose").Document | null,
 *   publicRenewal: { pendingChatResetAt: string | null, tableChatRevision: number, chatJustCleared: boolean }
 * }>}
 */
export async function synchronizeTableChatRenewal(sessionToken) {
  const token = String(sessionToken || "").trim();
  if (!token) {
    return { session: null, publicRenewal: { pendingChatResetAt: null, tableChatRevision: 0, chatJustCleared: false } };
  }

  let chatJustCleared = false;
  let session = await TableChatSession.findOne({ sessionToken: token });
  if (!session) {
    return { session: null, publicRenewal: { pendingChatResetAt: null, tableChatRevision: 0, chatJustCleared: false } };
  }

  if (session.pendingChatResetForOrder) {
    const a = session.activeOrderId;
    if (!a || String(session.pendingChatResetForOrder) !== String(a)) {
      session.pendingChatResetAt = null;
      session.pendingChatResetForOrder = null;
      await session.save();
    }
  }

  session = await TableChatSession.findOne({ sessionToken: token });
  if (!session) {
    return { session: null, publicRenewal: { pendingChatResetAt: null, tableChatRevision: 0, chatJustCleared: false } };
  }

  if (session.pendingChatResetAt && new Date() >= new Date(session.pendingChatResetAt)) {
    const n = await tableChatSessionRepo.countMessages(session._id);
    const pendingFor = session.pendingChatResetForOrder;
    if (n > 0) {
      await tableChatSessionRepo.clearAllMessagesAndBumpRevision(session._id);
      chatJustCleared = true;
    }
    await TableChatSession.findByIdAndUpdate(session._id, {
      $set: {
        lastChatClearedForOrder: pendingFor,
        pendingChatResetAt: null,
        pendingChatResetForOrder: null,
        lastActivityAt: new Date(),
      },
    });
  }

  session = await TableChatSession.findOne({ sessionToken: token });
  if (!session) {
    return { session: null, publicRenewal: { pendingChatResetAt: null, tableChatRevision: 0, chatJustCleared } };
  }

  const orderAfter = session.activeOrderId ? await Order.findById(session.activeOrderId).lean() : null;
  if (orderAfter && orderQualifiesForChatRenewal(orderAfter)) {
    const oId = orderAfter._id;
    const lastC = session.lastChatClearedForOrder;
    if (oId && (!lastC || String(oId) !== String(lastC))) {
      const msgCount = (session.messages || []).length;
      if (msgCount > 0 && !session.pendingChatResetAt) {
        const at = new Date(Date.now() + CHAT_RENEWAL_DELAY_MS);
        await TableChatSession.findByIdAndUpdate(session._id, {
          $set: {
            pendingChatResetAt: at,
            pendingChatResetForOrder: oId,
            lastActivityAt: new Date(),
          },
        });
      }
    }
  }

  session = await TableChatSession.findOne({ sessionToken: token });
  if (!session) {
    return { session: null, publicRenewal: { pendingChatResetAt: null, tableChatRevision: 0, chatJustCleared } };
  }

  return {
    session,
    publicRenewal: {
      pendingChatResetAt: session.pendingChatResetAt
        ? new Date(session.pendingChatResetAt).toISOString()
        : null,
      tableChatRevision: session.tableChatRevision || 0,
      chatJustCleared,
    },
  };
}
