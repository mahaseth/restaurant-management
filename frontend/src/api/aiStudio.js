import api from "@/api";

export async function getAiStudioStatus() {
  const { data } = await api.get("/api/ai-studio");
  return data;
}

export async function provisionAgent() {
  const { data } = await api.post("/api/ai-studio/provision");
  return data;
}

/** Full manual re-index of the menu for AI search. Auto-sync also runs after each menu add/edit/delete/image change. */
export async function syncMenuToVectorStore() {
  const { data } = await api.post("/api/ai-studio/sync-menu");
  return data;
}

export async function patchAiBranding(body) {
  const { data } = await api.patch("/api/ai-studio/branding", body);
  return data;
}

function postImageForm(path, file) {
  const fd = new FormData();
  fd.append("image", file);
  return api.post(path, fd);
}

export async function uploadAiAvatar(file) {
  const { data } = await postImageForm("/api/ai-studio/upload/avatar", file);
  return data;
}

export async function uploadAiBackground(file) {
  const { data } = await postImageForm("/api/ai-studio/upload/background", file);
  return data;
}

export async function uploadAiVoucherBarcode(file) {
  const { data } = await postImageForm("/api/ai-studio/upload/voucher-barcode", file);
  return data;
}

/** @param {Record<string, string|number|boolean>} [params] limit, skip, confidence, fallbackUsed, from, to */
export async function getAiEvalLogs(params) {
  const { data } = await api.get("/api/ai-studio/evaluation/logs", { params });
  return data;
}

/** @param {Record<string, string>} [params] from, to (ISO dates) */
export async function getAiEvalSummary(params) {
  const { data } = await api.get("/api/ai-studio/evaluation/summary", { params });
  return data;
}

export async function patchAiEvalReview(logId, reviewLabel) {
  const { data } = await api.patch(`/api/ai-studio/evaluation/logs/${encodeURIComponent(logId)}/review`, {
    reviewLabel,
  });
  return data;
}
