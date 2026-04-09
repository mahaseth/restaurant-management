import express from "express";
import * as ctrl from "./aiStudio.controller.js";
import * as evalCtrl from "./tableAssistantEval.controller.js";
import roleBasedAuth from "../../middlewares/roleBasedAuth.js";
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from "../../constants/roles.js";

const router = express.Router();

const evalRoles = [ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER];

router.get("/", ctrl.getStatus);
router.post("/provision", ctrl.postProvision);
router.post("/sync-menu", ctrl.postSyncMenu);
router.patch("/branding", ctrl.patchBranding);
router.post("/upload/avatar", ctrl.postUploadAvatar);
router.post("/upload/background", ctrl.postUploadBackground);
router.post("/upload/voucher-barcode", ctrl.postUploadVoucherBarcode);

router.get("/evaluation/logs", roleBasedAuth(evalRoles), evalCtrl.getEvalLogs);
router.get("/evaluation/summary", roleBasedAuth(evalRoles), evalCtrl.getEvalSummary);
router.patch("/evaluation/logs/:id/review", roleBasedAuth(evalRoles), evalCtrl.patchEvalReview);

export default router;
