#!/usr/bin/env node
/**
 * Fire a small fixed prompt set against the public table-session chat API.
 * Creates real session messages and evaluation logs (if the backend persists them).
 *
 * Usage (from backend/):
 *   TABLE_SESSION_TOKEN=<token> node scripts/eval-table-chat-sample.mjs
 *
 * Optional:
 *   API_BASE_URL=http://localhost:5000
 */
import "dotenv/config";

const BASE = (process.env.API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const TOKEN = process.env.TABLE_SESSION_TOKEN;

const PROMPTS = [
  "I am allergic to dairy",
  "Show vegan spicy dishes",
  "What is in butter chicken?",
  "Do you have sushi?",
];

async function sendMessage(message) {
  const url = `${BASE}/api/public/table-session/${encodeURIComponent(TOKEN)}/chat/message`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  if (!TOKEN) {
    console.error("Set TABLE_SESSION_TOKEN to a live table session token (scan table QR / use session API).");
    process.exit(1);
  }

  console.log(`API: ${BASE}\n`);

  for (const message of PROMPTS) {
    /* eslint-disable no-await-in-loop */
    const { ok, status, json } = await sendMessage(message);
    console.log("=".repeat(72));
    console.log("USER:", message);
    console.log("HTTP:", status, ok ? "OK" : "FAIL");
    if (!ok) {
      console.log("Body:", JSON.stringify(json, null, 2));
      continue;
    }
    const retrieval = json?.data?.retrieval;
    const content = json?.data?.assistantMessage?.content || "";
    console.log("Retrieval:", JSON.stringify(retrieval, null, 2));
    console.log("Assistant (preview):", content.slice(0, 600) + (content.length > 600 ? "…" : ""));
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
