import mongoose from "mongoose";

const REVIEW_LABELS = ["useful", "unclear", "incorrect", "unsafe"];
const CONFIDENCE_LEVELS = ["high", "low", "none"];
const SUCCESS_HEURISTICS = ["likely_ok", "uncertain", "fallback_or_weak"];

const tableAssistantEvalLogSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TableChatSession",
      required: true,
      index: true,
    },
    sessionToken: { type: String, required: true, trim: true },
    userQuery: { type: String, required: true },
    retrievalQuery: { type: String, default: "" },
    queryIntent: { type: mongoose.Schema.Types.Mixed, default: {} },
    matchedMenuItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    confidence: { type: String, enum: CONFIDENCE_LEVELS, required: true },
    fallbackUsed: { type: Boolean, required: true },
    assistantMessage: { type: String, required: true },
    responseTimeMs: { type: Number },
    topSimilarity: { type: Number },
    thresholdsUsed: { type: mongoose.Schema.Types.Mixed },
    /** Lightweight automated hint for reporting; not a ground-truth label. */
    successHeuristic: { type: String, enum: SUCCESS_HEURISTICS, required: true },
    /** Optional human review for future tooling. */
    reviewLabel: {
      type: String,
      default: undefined,
      validate: {
        validator(v) {
          return v == null || REVIEW_LABELS.includes(v);
        },
        message: "Invalid reviewLabel",
      },
    },
  },
  { timestamps: true }
);

tableAssistantEvalLogSchema.index({ restaurantId: 1, createdAt: -1 });
tableAssistantEvalLogSchema.index({ restaurantId: 1, confidence: 1, createdAt: -1 });
tableAssistantEvalLogSchema.index({ restaurantId: 1, fallbackUsed: 1, createdAt: -1 });

const TableAssistantEvalLog = mongoose.model("TableAssistantEvalLog", tableAssistantEvalLogSchema);
export default TableAssistantEvalLog;
export { REVIEW_LABELS, CONFIDENCE_LEVELS, SUCCESS_HEURISTICS };
