"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toast } from "react-toastify";
import { getAiEvalLogs, getAiEvalSummary } from "@/api/aiStudio";

function formatIntent(intent) {
  if (!intent || typeof intent !== "object") return "—";
  const bits = [];
  if (intent.allergenFocus) bits.push("allergen");
  if (intent.dietaryFocus) bits.push("dietary");
  if (intent.ingredientFocus) bits.push("ingredient");
  if (intent.recommendationIntent) bits.push("recommend");
  return bits.length ? bits.join(", ") : "—";
}

function dishesBody(row) {
  const items = row.matchedMenuItems;
  if (!Array.isArray(items) || !items.length) return "—";
  return items
    .map((m) => m.name || m.menuItemId || "?")
    .slice(0, 4)
    .join(", ");
}

export default function AiEvaluationPanel() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, sumRes] = await Promise.all([getAiEvalLogs({ limit: 40 }), getAiEvalSummary({})]);
      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data.items || []);
        setTotal(logsRes.data.total ?? 0);
      } else {
        toast.error(logsRes.error || "Could not load evaluation logs");
      }
      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      else if (!sumRes.success) toast.error(sumRes.error || "Could not load summary");
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Table assistant evaluation</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Recent guest chat turns (RAG retrieval, confidence, fallbacks). Use for capstone evidence and tuning. Logs
              are written server-side; guests are unaffected.
            </p>
          </div>
          <Button type="button" label="Refresh" icon="pi pi-refresh" onClick={load} loading={loading} outlined size="small" />
        </div>

        {summary && (
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Turns: {summary.totalTurns ?? 0}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
              High conf: {summary.confidence?.high ?? 0}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-900/35 dark:text-amber-100">
              Low: {summary.confidence?.low ?? 0}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900 dark:bg-red-950/50 dark:text-red-100">
              None: {summary.confidence?.none ?? 0}
            </span>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
              Fallback: {summary.fallbackCount ?? 0}
            </span>
          </div>
        )}

        {summary?.queryIntentCounts && (
          <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Intent flags (all time in range): </span>
            allergen {summary.queryIntentCounts.allergenFocus ?? 0}, dietary{" "}
            {summary.queryIntentCounts.dietaryFocus ?? 0}, ingredient {summary.queryIntentCounts.ingredientFocus ?? 0},
            recommend {summary.queryIntentCounts.recommendationIntent ?? 0}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recent turns</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Showing {logs.length} of {total}</span>
        </div>
        <DataTable value={logs} loading={loading} dataKey="_id" size="small" scrollable scrollHeight="420px" emptyMessage="No logs yet — send a few table chat messages first.">
          <Column
            field="createdAt"
            header="When"
            body={(r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "—")}
            style={{ minWidth: "140px" }}
          />
          <Column field="userQuery" header="Query" style={{ minWidth: "180px" }} />
          <Column header="Intent" body={(r) => formatIntent(r.queryIntent)} style={{ minWidth: "100px" }} />
          <Column field="confidence" header="Conf." style={{ width: "72px" }} />
          <Column
            field="fallbackUsed"
            header="FB"
            body={(r) => (r.fallbackUsed ? "yes" : "no")}
            style={{ width: "56px" }}
          />
          <Column field="successHeuristic" header="Heuristic" style={{ minWidth: "110px" }} />
          <Column header="Dishes (retrieved)" body={dishesBody} style={{ minWidth: "160px" }} />
          <Column field="reviewLabel" header="Review" style={{ width: "80px" }} />
        </DataTable>
      </div>
    </div>
  );
}
