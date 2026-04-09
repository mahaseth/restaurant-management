import * as evalService from "./services/tableAssistantEval.service.js";

export async function getEvalLogs(req, res) {
  try {
    const data = await evalService.listLogsForRequest(req);
    res.json({ success: true, data });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ success: false, error: e.message || "Failed to load logs" });
  }
}

export async function getEvalSummary(req, res) {
  try {
    const data = await evalService.summaryForRequest(req);
    res.json({ success: true, data });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ success: false, error: e.message || "Failed to load summary" });
  }
}

export async function patchEvalReview(req, res) {
  try {
    const data = await evalService.patchReviewForRequest(req);
    res.json({ success: true, data: { log: data } });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ success: false, error: e.message || "Failed to update review" });
  }
}
