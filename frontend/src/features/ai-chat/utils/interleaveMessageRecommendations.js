/** @typedef {{ menuItemId?: string, name?: string, price?: number, imageUrl?: string }} MenuRec */

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(lineName, dishName) {
  const a = normalizeName(lineName);
  const b = normalizeName(dishName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = a.split(" ").filter((w) => w.length >= 2);
  const bWords = b.split(" ").filter((w) => w.length >= 2);
  if (!aWords.length || !bWords.length) return false;
  return aWords.every((w) => b.includes(w)) || bWords.every((w) => a.includes(w));
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip list prefix and pull dish title before dash/colon or from **bold**. */
export function extractDishNameFromLine(line) {
  let rest = String(line || "").trim();
  rest = rest.replace(/^\d+[\.\)]\s+/, "").replace(/^[-•]\s+/, "");
  const bold = rest.match(/^\*\*(.+?)\*\*/);
  if (bold) return bold[1].trim();
  const beforeDash = rest.split(/\s*[—–-]\s+/)[0];
  const beforeColon = beforeDash.split(/\s*:\s+/)[0];
  return beforeColon.replace(/\*\*/g, "").trim();
}

/** Split a list line into number, dish title, and trailing description for cleaner UI. */
export function parseDishLine(line) {
  const raw = String(line || "").trim();
  const numMatch = raw.match(/^(\d+)[\.\)]\s+/);
  const number = numMatch ? numMatch[1] : null;
  const title = extractDishNameFromLine(raw);
  let description = raw.replace(/^\d+[\.\)]\s+/, "").replace(/^[-•]\s+/, "");

  if (title) {
    const t = escapeRegex(title);
    description = description
      .replace(new RegExp(`^\\*\\*${t}\\*\\*\\s*`, "i"), "")
      .replace(new RegExp(`^${t}\\s*`, "i"), "")
      .replace(/^[—–-]\s*/, "")
      .replace(/^:\s*/, "")
      .trim();
  }

  description = description.replace(/\*\*/g, "").trim();
  return { number, title, description: description || null, raw };
}

export function lineKind(line) {
  const t = String(line || "").trim();
  if (!t) return "blank";
  if (/^\d+[\.\)]\s+/.test(t)) return "ordered";
  if (/^[-•]\s+/.test(t)) return "bullet";
  return "text";
}

function recKey(item) {
  return String(item?.menuItemId || item?.name || "");
}

/**
 * Pair assistant lines with menu recommendation cards for inline rendering.
 * @returns {Array<{ type: 'text', lines: string[] } | { type: 'dish', line: string, item: MenuRec } | { type: 'cards', items: MenuRec[] }>}
 */
export function buildInterleavedMessageSegments(content, menuRecommendations = []) {
  const lines = String(content || "").split("\n");
  const recs = Array.isArray(menuRecommendations) ? [...menuRecommendations] : [];
  if (!recs.length) {
    const nonEmpty = lines.filter((l) => String(l).trim());
    return nonEmpty.length ? [{ type: "text", lines }] : [];
  }

  const used = new Set();
  const segments = [];
  let textBuffer = [];

  const flushText = () => {
    if (!textBuffer.length) return;
    segments.push({ type: "text", lines: [...textBuffer] });
    textBuffer = [];
  };

  const claimMatch = (line) => {
    const fromLine = extractDishNameFromLine(line);
    if (fromLine) {
      for (const item of recs) {
        const key = recKey(item);
        if (!key || used.has(key)) continue;
        if (namesMatch(fromLine, item.name)) {
          used.add(key);
          return item;
        }
      }
    }

    const lower = line.toLowerCase();
    let best = null;
    let bestPos = Infinity;
    for (const item of recs) {
      const key = recKey(item);
      if (!key || used.has(key)) continue;
      const name = String(item.name || "").trim();
      if (!name) continue;
      const pos = lower.indexOf(name.toLowerCase());
      if (pos !== -1 && pos < bestPos) {
        bestPos = pos;
        best = item;
      }
    }
    if (best) used.add(recKey(best));
    return best;
  };

  for (const rawLine of lines) {
    const line = rawLine;
    const kind = lineKind(line);

    if (kind === "blank") {
      textBuffer.push(line);
      continue;
    }

    if (kind === "ordered" || kind === "bullet") {
      const item = claimMatch(line);
      if (item) {
        flushText();
        segments.push({ type: "dish", line, item });
        continue;
      }
    }

    if (kind === "text" && /\*\*.+?\*\*/.test(line)) {
      const item = claimMatch(line);
      if (item) {
        flushText();
        segments.push({ type: "dish", line, item });
        continue;
      }
    }

    textBuffer.push(line);
  }

  flushText();

  const unmatched = recs.filter((it) => !used.has(recKey(it)));
  if (unmatched.length) segments.push({ type: "cards", items: unmatched });

  const hasDishPairs = segments.some((s) => s.type === "dish");
  if (!hasDishPairs) {
    return [
      ...(lines.some((l) => String(l).trim()) ? [{ type: "text", lines }] : []),
      { type: "cards", items: recs },
    ];
  }

  return segments;
}
