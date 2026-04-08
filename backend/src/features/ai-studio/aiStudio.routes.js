import express from "express";
import * as ctrl from "./aiStudio.controller.js";

const router = express.Router();

router.get("/", ctrl.getStatus);
router.post("/provision", ctrl.postProvision);
router.post("/sync-menu", ctrl.postSyncMenu);
router.patch("/branding", ctrl.patchBranding);
router.post("/upload/avatar", ctrl.postUploadAvatar);
router.post("/upload/background", ctrl.postUploadBackground);
router.post("/upload/voucher-barcode", ctrl.postUploadVoucherBarcode);

export default router;
