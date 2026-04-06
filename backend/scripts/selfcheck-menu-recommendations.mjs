/**
 * Quick sanity check for menuRecommendations.util.js (no network).
 * Run: node backend/scripts/selfcheck-menu-recommendations.mjs
 */
import * as m from "../src/features/ai-studio/services/menuRecommendations.util.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

assert(m.normalizeMenuImageUrl("https://x.com/a.jpg") === "https://x.com/a.jpg");
assert(m.normalizeMenuImageUrl("//cdn.example/x.png") === "https://cdn.example/x.png");
assert(m.normalizeMenuImageUrl("/uploads/x.jpg") === "/uploads/x.jpg");

const rawWithFence = [
  "Hello",
  ":::menu_recommendations:::```json",
  '[{"menuItemId":"1","name":"Momo","price":5,"imageUrl":"https://i.com/m.jpg"}]',
  "```",
].join("\n");
const e1 = m.extractMenuRecommendationsFromAssistantText(rawWithFence);
assert(e1.menuRecommendations.length === 1, "extract with fence");
assert(e1.menuRecommendations[0].name === "Momo");
assert(e1.menuRecommendations[0].imageUrl.includes("https://"));

const rows = [
  { attributes: { menuItemId: "a", name: "Chicken Thali Biryani", price: 3, imageUrl: "https://x.com/b.jpg" } },
];
const inf = m.inferMenuRecommendationsFromReply("We have Chicken and Thali and Biryani today.", rows);
assert(inf.length === 1 && inf[0].imageUrl, "infer words");

assert(m.isBroadMenuIntentUserMessage("food") === true);
assert(m.isBroadMenuIntentUserMessage("random unrelated long question about politics") === false);

const fb = m.fallbackRecommendationsFromContextRows(rows, 2);
assert(fb.length === 1 && fb[0].name === "Chicken Thali Biryani");

console.log("selfcheck-menu-recommendations: OK");
