import express from "express";
import { addItemsToPublicOrder, getPublicOrderByNumber, getPublicTableInfo } from "../controllers/public.controller.js";
import * as publicAiChat from "../features/ai-studio/publicAiChat.controller.js";

const router = express.Router();

// Public read-only endpoints used by the QR customer experience.
router.get("/table/:tableId", getPublicTableInfo);
router.get("/order/:orderNumber", getPublicOrderByNumber);
router.patch("/order/:orderNumber/items", addItemsToPublicOrder);

// Public AI chat (customer-facing; no auth)
router.get("/ai-chat/agent", publicAiChat.getPublicAgent);
router.get("/ai-chat/conversation", publicAiChat.getConversation);
router.post("/ai-chat/message", publicAiChat.postMessage);

export default router;

