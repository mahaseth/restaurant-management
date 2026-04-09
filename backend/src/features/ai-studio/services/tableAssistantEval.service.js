import {
  insertEvalLog,
  findEvalLogsForRestaurant,
  aggregateEvalSummary,
  updateEvalReviewLabel,
} from "../../../repositories/tableAssistantEval.repository.js";
import { REVIEW_LABELS } from "../../../models/TableAssistantEvalLog.js";

export function inferSuccessHeuristic({ confidence, fallbackUsed }) {
  if (fallbackUsed) return "fallback_or_weak";
  if (confidence === "high") return "likely_ok";
  if (confidence === "low") return "uncertain";
  return "fallback_or_weak";
}

/**
 * Persist eval row without blocking the chat HTTP path.
 * @param {object} payload
 */
export function schedulePersistTableChatEvalTurn(payload) {
  void (async () => {
    try {
      await insertEvalLog(payload);
    } catch (e) {
      console.error("[aiEval] failed to persist turn:", e?.message || e);
    }
  })();
}

function parseBoolQuery(v) {
  if (v === undefined || v === null || v === "") return undefined;
  if (v === true || v === false) return v;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return undefined;
}

function parseDate(v, endOfDay = false) {
  if (v == null || v === "") return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

export async function listLogsForRequest(req) {
  const restaurantId = req.restaurant?._id;
  if (!restaurantId) {
    const err = new Error("Restaurant context missing.");
    err.statusCode = 400;
    throw err;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = Math.max(Number(req.query.skip) || 0, 0);
  const confidence = req.query.confidence;
  const fallbackUsed = parseBoolQuery(req.query.fallbackUsed);
  const from = parseDate(req.query.from, false);
  const to = parseDate(req.query.to, true);

  const filters = {};
  if (confidence === "high" || confidence === "low" || confidence === "none") {
    filters.confidence = confidence;
  }
  if (typeof fallbackUsed === "boolean") filters.fallbackUsed = fallbackUsed;
  if (from) filters.from = from;
  if (to) filters.to = to;

  const { items, total } = await findEvalLogsForRestaurant(restaurantId, filters, { limit, skip });
  return {
    items,
    total,
    limit,
    skip,
  };
}

export async function summaryForRequest(req) {
  const restaurantId = req.restaurant?._id;
  if (!restaurantId) {
    const err = new Error("Restaurant context missing.");
    err.statusCode = 400;
    throw err;
  }
  const from = parseDate(req.query.from, false);
  const to = parseDate(req.query.to, true);
  const range = {};
  if (from) range.from = from;
  if (to) range.to = to;
  return aggregateEvalSummary(restaurantId, range);
}

export async function patchReviewForRequest(req) {
  const restaurantId = req.restaurant?._id;
  if (!restaurantId) {
    const err = new Error("Restaurant context missing.");
    err.statusCode = 400;
    throw err;
  }
  const { id } = req.params;
  const body = req.body || {};
  if (!Object.prototype.hasOwnProperty.call(body, "reviewLabel")) {
    const err = new Error("reviewLabel is required (use null to clear).");
    err.statusCode = 400;
    throw err;
  }
  const label = body.reviewLabel;
  if (label !== null && !REVIEW_LABELS.includes(label)) {
    const err = new Error(`reviewLabel must be one of: ${REVIEW_LABELS.join(", ")} or null.`);
    err.statusCode = 400;
    throw err;
  }
  const updated = await updateEvalReviewLabel(restaurantId, id, label);
  if (!updated) {
    const err = new Error("Log not found.");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}
