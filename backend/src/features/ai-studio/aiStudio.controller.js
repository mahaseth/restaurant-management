import uploadFile, { deleteCloudinaryFileByUrl } from "../../utils/fileUploader.js";
import Restaurant from "../../models/Restaurant.js";
import { mergeChatTheme, resolveThemeForApi } from "./services/chatBranding.service.js";
import { getOrProvisionAgent, findAgentByRestaurantId } from "./services/provisionAgent.service.js";
import { syncMenuAndUpdateAgentMeta } from "./services/menuSync.service.js";
import config from "../../config/config.js";

function restaurantIdFromReq(req) {
  return req.restaurant?._id?.toString?.() || req.restaurant?._id;
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const noSlash = raw.replace(/\/+$/, "");
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(noSlash)) {
    return `https://${noSlash}`;
  }
  return noSlash;
}

function originFromReferer(referer) {
  const ref = String(referer || "").trim();
  if (!ref) return "";
  try {
    const u = new URL(ref);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

export function resolveFrontendBaseUrl(req) {
  const requestOrigin = normalizeBaseUrl(req?.headers?.origin);
  if (requestOrigin) return requestOrigin;

  const refererOrigin = normalizeBaseUrl(originFromReferer(req?.headers?.referer));
  if (refererOrigin) return refererOrigin;

  return normalizeBaseUrl(config.clientUrl);
}

export async function getStatus(req, res) {
  try {
    const rid = restaurantIdFromReq(req);
    if (!rid) return res.status(400).json({ success: false, error: "Restaurant context missing." });

    const agent = await findAgentByRestaurantId(rid);
    if (!agent) {
      return res.json({
        success: true,
        data: {
          provisioned: false,
          enabled: false,
          publicSlug: null,
          lastMenuSyncAt: null,
          lastMenuSyncError: "",
          menuRowCount: 0,
          chatUrl: null,
          qrUrl: null,
          guestChatViaTableQr: false,
          agentDisplayName: "",
          avatarUrl: "",
          backgroundImageUrl: "",
          voucherBarcodeUrl: "",
          chatTheme: mergeChatTheme({}),
          responseStyle: "default",
          agentTone: "friendly",
          brandStory: "",
          customInstructions: "",
          omitAgentName: false,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        provisioned: true,
        enabled: agent.enabled,
        publicSlug: agent.publicSlug,
        lastMenuSyncAt: agent.lastMenuSyncAt,
        lastMenuSyncError: agent.lastMenuSyncError || "",
        menuRowCount: agent.menuRowCount ?? 0,
        chatUrl: null,
        qrUrl: null,
        guestChatViaTableQr: true,
        agentDisplayName: agent.agentDisplayName || "",
        avatarUrl: agent.avatarUrl || "",
        backgroundImageUrl: agent.backgroundImageUrl || "",
        voucherBarcodeUrl: agent.voucherBarcodeUrl || "",
        chatTheme: resolveThemeForApi(agent),
        responseStyle: agent.responseStyle || "default",
        agentTone: agent.agentTone || "friendly",
        brandStory: agent.brandStory || "",
        customInstructions: agent.customInstructions || "",
        omitAgentName: !!agent.omitAgentName,
      },
    });
  } catch (e) {
    console.error("[ai-studio] getStatus", e);
    res.status(500).json({ success: false, error: e.message || "Server error" });
  }
}

export async function postProvision(req, res) {
  try {
    const rid = restaurantIdFromReq(req);
    if (!rid) return res.status(400).json({ success: false, error: "Restaurant context missing." });

    const { agent, created } = await getOrProvisionAgent(rid, { forceProvision: true });
    if (created || !agent.provisionedAt) {
      agent.provisionedAt = new Date();
      agent.enabled = true;
      await agent.save();
    }

    const restaurant = await Restaurant.findById(rid).lean();
    if (restaurant && !agent.agentDisplayName) {
      agent.agentDisplayName = restaurant.name;
      await agent.save();
    }

    res.json({
      success: true,
      data: {
        publicSlug: agent.publicSlug,
        enabled: agent.enabled,
        chatUrl: null,
        qrUrl: null,
        guestChatViaTableQr: true,
      },
    });
  } catch (e) {
    console.error("[ai-studio] postProvision", e);
    res.status(500).json({ success: false, error: e.message || "Server error" });
  }
}

export async function postSyncMenu(req, res) {
  try {
    const rid = restaurantIdFromReq(req);
    if (!rid) return res.status(400).json({ success: false, error: "Restaurant context missing." });

    const agent = await findAgentByRestaurantId(rid);
    if (!agent || !agent.enabled) {
      return res.status(400).json({ success: false, error: "Provision the AI agent first." });
    }

    const { rowCount, lastMenuSyncAt } = await syncMenuAndUpdateAgentMeta(rid);

    res.json({ success: true, data: { rowCount, lastMenuSyncAt } });
  } catch (e) {
    console.error("[ai-studio] postSyncMenu", e);
    res.status(500).json({ success: false, error: e.message || "Sync failed" });
  }
}

export async function patchBranding(req, res) {
  try {
    const rid = restaurantIdFromReq(req);
    if (!rid) return res.status(400).json({ success: false, error: "Restaurant context missing." });

    let agent = await findAgentByRestaurantId(rid);
    if (!agent) {
      const r = await getOrProvisionAgent(rid);
      agent = r.agent;
    }

    const {
      chatTheme,
      agentDisplayName,
      avatarUrl,
      backgroundImageUrl,
      voucherBarcodeUrl,
      responseStyle,
      agentTone,
      brandStory,
      customInstructions,
      omitAgentName,
    } = req.body || {};

    if (typeof agentDisplayName === "string") agent.agentDisplayName = agentDisplayName.trim().slice(0, 120);
    if (typeof avatarUrl === "string") agent.avatarUrl = avatarUrl.trim();
    if (typeof backgroundImageUrl === "string") agent.backgroundImageUrl = backgroundImageUrl.trim();
    if (typeof voucherBarcodeUrl === "string") agent.voucherBarcodeUrl = voucherBarcodeUrl.trim();

    if (responseStyle === "concise" || responseStyle === "default" || responseStyle === "verbose") {
      agent.responseStyle = responseStyle;
    }
    if (typeof agentTone === "string") {
      agent.agentTone = agentTone.trim().slice(0, 48) || "friendly";
    }
    if (typeof brandStory === "string") agent.brandStory = brandStory.slice(0, 2000);
    if (typeof customInstructions === "string") agent.customInstructions = customInstructions.slice(0, 4000);
    if (typeof omitAgentName === "boolean") agent.omitAgentName = omitAgentName;

    if (chatTheme && typeof chatTheme === "object") {
      // Replace theme from payload merged with defaults (no merge with previous doc) so removed keys stay gone.
      agent.chatTheme = mergeChatTheme(chatTheme);
    }

    await agent.save();

    res.json({
      success: true,
      data: {
        agentDisplayName: agent.agentDisplayName,
        avatarUrl: agent.avatarUrl,
        backgroundImageUrl: agent.backgroundImageUrl,
        voucherBarcodeUrl: agent.voucherBarcodeUrl,
        chatTheme: resolveThemeForApi(agent),
        responseStyle: agent.responseStyle,
        agentTone: agent.agentTone,
        brandStory: agent.brandStory,
        customInstructions: agent.customInstructions,
        omitAgentName: agent.omitAgentName,
      },
    });
  } catch (e) {
    console.error("[ai-studio] patchBranding", e);
    res.status(500).json({ success: false, error: e.message || "Server error" });
  }
}

async function handleAssetUpload(req, res, field, updateField) {
  try {
    const rid = restaurantIdFromReq(req);
    if (!rid) return res.status(400).json({ success: false, error: "Restaurant context missing." });
    if (!req.file?.buffer) return res.status(400).json({ success: false, error: "Image file required." });

    let agent = await findAgentByRestaurantId(rid);
    if (!agent) {
      const r = await getOrProvisionAgent(rid);
      agent = r.agent;
    }

    const prevUrl = agent[updateField];
    const uploaded = await uploadFile([req.file], `/rest-id-${rid}/ai-chat/${field}`);
    const url = uploaded?.[0]?.secure_url || uploaded?.[0]?.url || "";
    if (!url) throw new Error("Upload failed");

    if (prevUrl) await deleteCloudinaryFileByUrl(prevUrl).catch(() => {});
    agent[updateField] = url;
    await agent.save();

    res.json({ success: true, data: { [updateField]: url } });
  } catch (e) {
    console.error(`[ai-studio] upload ${field}`, e);
    res.status(500).json({ success: false, error: e.message || "Upload failed" });
  }
}

export const postUploadAvatar = (req, res) => handleAssetUpload(req, res, "avatar", "avatarUrl");
export const postUploadBackground = (req, res) => handleAssetUpload(req, res, "background", "backgroundImageUrl");
export const postUploadVoucherBarcode = (req, res) =>
  handleAssetUpload(req, res, "voucher-barcode", "voucherBarcodeUrl");
