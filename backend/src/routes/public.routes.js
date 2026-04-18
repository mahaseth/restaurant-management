import express from "express";
import { addItemsToPublicOrder, getPublicOrderByNumber, getPublicTableInfo } from "../controllers/public.controller.js";
import * as publicTableSession from "../features/ai-studio/publicTableSession.controller.js";

const router = express.Router();

// Public read-only endpoints (legacy direct tableId flows; unified QR prefers table session).
router.get("/table/:tableId", getPublicTableInfo);
router.get("/order/:orderNumber", getPublicOrderByNumber);
router.patch("/order/:orderNumber/items", addItemsToPublicOrder);

// Unified table QR → persistent session
router.get("/qr/:qrToken/session", publicTableSession.getQrSession);

// Session-scoped state (register specific paths before generic :sessionToken)
router.get("/table-session/:sessionToken/order-status", publicTableSession.getOrderStatus);
router.post("/table-session/:sessionToken/order", publicTableSession.postPlaceOrder);
router.get("/table-session/:sessionToken/cart", publicTableSession.getCart);
router.post("/table-session/:sessionToken/cart/items", publicTableSession.postCartItem);
router.patch("/table-session/:sessionToken/cart/items/:menuItemId", publicTableSession.patchCartItem);
router.delete("/table-session/:sessionToken/cart/items/:menuItemId", publicTableSession.deleteCartItem);
router.delete("/table-session/:sessionToken/cart", publicTableSession.deleteCart);
router.get("/table-session/:sessionToken/agent", publicTableSession.getAgent);
router.get("/table-session/:sessionToken/conversation", publicTableSession.getConversation);
router.post("/table-session/:sessionToken/conversation/reset", publicTableSession.postResetConversation);
router.post("/table-session/:sessionToken/chat/message", publicTableSession.postChatMessage);
router.get("/table-session/:sessionToken", publicTableSession.getSessionState);

export default router;
