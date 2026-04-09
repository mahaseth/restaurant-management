import mongoose from "mongoose";

/**
 * One document per restaurant: stable internal slug (legacy id), branding, sync metadata, menu RAG target.
 * Guest AI chat is table-QR + sessionToken only; publicSlug is not a supported entry path.
 */
const restaurantAiAgentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true,
    },
    publicSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    provisionedAt: {
      type: Date,
    },
    lastMenuSyncAt: Date,
    lastMenuSyncError: { type: String, default: "" },
    menuRowCount: { type: Number, default: 0 },
    avatarUrl: { type: String, default: "" },
    backgroundImageUrl: { type: String, default: "" },
    voucherBarcodeUrl: { type: String, default: "" },
    /** GPTA-aligned theme subset; merged with defaults in chatBranding.service */
    chatTheme: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Display name shown on guest chat header */
    agentDisplayName: {
      type: String,
      default: "",
    },
    /** How verbose replies should be (system prompt) */
    responseStyle: {
      type: String,
      enum: ["concise", "default", "verbose"],
      default: "default",
    },
    /** Voice / nature of the assistant */
    agentTone: {
      type: String,
      default: "friendly",
      trim: true,
    },
    /** Short brand story & positioning for the model (not shown on chat UI) */
    brandStory: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    /** Extra rules for the assistant (markdown-friendly) */
    customInstructions: {
      type: String,
      default: "",
      maxlength: 4000,
    },
    /** If true, system prompt asks the model not to use its name in replies */
    omitAgentName: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const RestaurantAiAgent = mongoose.model("RestaurantAiAgent", restaurantAiAgentSchema);
export default RestaurantAiAgent;
