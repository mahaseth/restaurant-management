/**
 * Light keyword overlap boost on top of pgvector similarity so queries like
 * "peanut" or "gluten free" prefer rows whose stored content mentions those terms.
 * Vector order still dominates; this nudges ties and near-misses.
 */
export function applyRetrievalKeywordBoost(rows, ...queryParts) {
  const q = queryParts
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(" ")
    .trim();
  if (!q || !Array.isArray(rows) || rows.length === 0) return rows;

  const terms = [...new Set(q.split(/\s+/).filter((w) => w.length > 2))];
  if (!terms.length) return rows;

  const scored = rows.map((r) => {
    const c = String(r.content || "").toLowerCase();
    const bonus = terms.reduce((s, t) => s + (c.includes(t) ? 0.035 : 0), 0);
    const sim = Number(r.similarity);
    const base = Number.isFinite(sim) ? sim : 0;
    return { row: r, score: base + bonus };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.row);
}
