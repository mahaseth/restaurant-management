import mongoose from "mongoose";

const tableChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    menuRecommendations: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    suggestedActions: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          action: { type: String, required: true },
        },
      ],
      default: undefined,
    },
    quickReplies: {
      type: [
        {
          label: { type: String, required: true },
          prompt: { type: String, required: true },
        },
      ],
      default: undefined,
    },
  },
  { _id: false }
);

const sessionCartItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true, default: "", maxlength: 500 },
  },
  { _id: false }
);

const sessionCartSchema = new mongoose.Schema(
  {
    items: { type: [sessionCartItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const tableChatSessionSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    messages: {
      type: [tableChatMessageSchema],
      default: [],
    },
    cart: {
      type: sessionCartSchema,
      default: () => ({ items: [], subtotal: 0, updatedAt: new Date() }),
    },
    activeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    lastOrderStatus: {
      type: String,
      default: "",
      trim: true,
    },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const TableChatSession = mongoose.model("TableChatSession", tableChatSessionSchema);
export default TableChatSession;
