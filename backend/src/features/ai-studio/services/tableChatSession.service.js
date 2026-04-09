import Table from "../../../models/Table.js";
import { newUrlSafeToken } from "../../../utils/secureTokens.js";
import * as tableChatSessionRepo from "../../../repositories/tableChatSession.repository.js";

export async function resolveTableByQrToken(qrToken) {
  const raw = String(qrToken || "").trim();
  if (!raw) return null;
  return Table.findOne({ qrToken: raw }).lean();
}

/**
 * Persistent table session for unified chat + ordering (no AI agent required).
 * @returns {{ table: object | null, session: import("mongoose").Document | null }}
 */
export async function getOrCreateSessionForQrToken(qrToken) {
  const table = await resolveTableByQrToken(qrToken);
  if (!table) return { table: null, session: null };

  let session = await tableChatSessionRepo.findSessionByTableId(table._id);
  if (!session) {
    let sessionToken = "";
    for (let i = 0; i < 8; i++) {
      const candidate = newUrlSafeToken();
      const clash = await tableChatSessionRepo.findSessionByToken(candidate);
      if (!clash) {
        sessionToken = candidate;
        break;
      }
    }
    if (!sessionToken) throw new Error("Could not allocate session token");
    try {
      session = await tableChatSessionRepo.createSessionForTable({
        sessionToken,
        tableId: table._id,
        restaurantId: table.restaurantId,
      });
    } catch (e) {
      if (e && (e.code === 11000 || e.code === "11000")) {
        session = await tableChatSessionRepo.findSessionByTableId(table._id);
      } else {
        throw e;
      }
    }
  }

  return { table, session };
}
