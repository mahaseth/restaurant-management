import mongoose from "mongoose";
import TableAssistantEvalLog from "../models/TableAssistantEvalLog.js";

export async function insertEvalLog(doc) {
  return TableAssistantEvalLog.create(doc);
}

export async function findEvalLogsForRestaurant(restaurantId, filters, { limit = 50, skip = 0 } = {}) {
  const q = { restaurantId };
  if (filters.confidence) q.confidence = filters.confidence;
  if (typeof filters.fallbackUsed === "boolean") q.fallbackUsed = filters.fallbackUsed;
  if (filters.from || filters.to) {
    q.createdAt = {};
    if (filters.from) q.createdAt.$gte = filters.from;
    if (filters.to) q.createdAt.$lte = filters.to;
  }
  const [items, total] = await Promise.all([
    TableAssistantEvalLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TableAssistantEvalLog.countDocuments(q),
  ]);
  return { items, total };
}

export async function updateEvalReviewLabel(restaurantId, logId, reviewLabel) {
  if (!mongoose.Types.ObjectId.isValid(logId)) return null;
  return TableAssistantEvalLog.findOneAndUpdate(
    { _id: logId, restaurantId },
    { $set: { reviewLabel } },
    { new: true, runValidators: true }
  ).lean();
}

/**
 * Aggregate summary for one restaurant in an optional date range.
 * @param {string|import("mongoose").Types.ObjectId} restaurantId
 * @param {{ from?: Date, to?: Date }} range
 */
export async function aggregateEvalSummary(restaurantId, range = {}) {
  const rid = new mongoose.Types.ObjectId(String(restaurantId));
  const match = { restaurantId: rid };
  if (range.from || range.to) {
    match.createdAt = {};
    if (range.from) match.createdAt.$gte = range.from;
    if (range.to) match.createdAt.$lte = range.to;
  }

  const [main, topItems] = await Promise.all([
    TableAssistantEvalLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTurns: { $sum: 1 },
          fallbackCount: { $sum: { $cond: ["$fallbackUsed", 1, 0] } },
          highConfidence: { $sum: { $cond: [{ $eq: ["$confidence", "high"] }, 1, 0] } },
          lowConfidence: { $sum: { $cond: [{ $eq: ["$confidence", "low"] }, 1, 0] } },
          noneConfidence: { $sum: { $cond: [{ $eq: ["$confidence", "none"] }, 1, 0] } },
          likelyOk: { $sum: { $cond: [{ $eq: ["$successHeuristic", "likely_ok"] }, 1, 0] } },
          uncertain: { $sum: { $cond: [{ $eq: ["$successHeuristic", "uncertain"] }, 1, 0] } },
          fallbackOrWeak: { $sum: { $cond: [{ $eq: ["$successHeuristic", "fallback_or_weak"] }, 1, 0] } },
          intentAllergen: {
            $sum: { $cond: [{ $eq: ["$queryIntent.allergenFocus", true] }, 1, 0] },
          },
          intentDietary: {
            $sum: { $cond: [{ $eq: ["$queryIntent.dietaryFocus", true] }, 1, 0] },
          },
          intentIngredient: {
            $sum: { $cond: [{ $eq: ["$queryIntent.ingredientFocus", true] }, 1, 0] },
          },
          intentRecommendation: {
            $sum: { $cond: [{ $eq: ["$queryIntent.recommendationIntent", true] }, 1, 0] },
          },
        },
      },
    ]),
    TableAssistantEvalLog.aggregate([
      { $match: match },
      { $unwind: { path: "$matchedMenuItems", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$matchedMenuItems.menuItemId",
          name: { $first: "$matchedMenuItems.name" },
          retrievalHits: { $sum: 1 },
        },
      },
      { $sort: { retrievalHits: -1 } },
      { $limit: 15 },
    ]),
  ]);

  const m = main[0] || {
    totalTurns: 0,
    fallbackCount: 0,
    highConfidence: 0,
    lowConfidence: 0,
    noneConfidence: 0,
    likelyOk: 0,
    uncertain: 0,
    fallbackOrWeak: 0,
    intentAllergen: 0,
    intentDietary: 0,
    intentIngredient: 0,
    intentRecommendation: 0,
  };

  const topMatchedMenuItems = topItems.map((row) => ({
    menuItemId: row._id || "",
    name: row.name || "",
    retrievalHits: row.retrievalHits,
  }));

  return {
    totalTurns: m.totalTurns,
    fallbackCount: m.fallbackCount,
    confidence: {
      high: m.highConfidence,
      low: m.lowConfidence,
      none: m.noneConfidence,
    },
    successHeuristic: {
      likelyOk: m.likelyOk,
      uncertain: m.uncertain,
      fallbackOrWeak: m.fallbackOrWeak,
    },
    queryIntentCounts: {
      allergenFocus: m.intentAllergen,
      dietaryFocus: m.intentDietary,
      ingredientFocus: m.intentIngredient,
      recommendationIntent: m.intentRecommendation,
    },
    topMatchedMenuItems,
  };
}
