/**
 * Regenerate Supabase/pgvector embeddings for menu items (full replace per restaurant).
 * Optionally updates AI Studio agent sync metadata when an agent exists.
 *
 * Usage (from backend/):
 *   npm run resync:menu-embeddings
 *   npm run resync:menu-embeddings -- <mongoRestaurantId>
 *
 * Requires: MONGODB_URL, SUPABASE_DATABASE_URL (or DATABASE_URL), OpenAI/Azure embedding config.
 */

import "dotenv/config";
import mongoose from "mongoose";
import config from "../src/config/config.js";
import MenuItem from "../src/models/MenuItem.js";
import { syncMenuAndUpdateAgentMeta } from "../src/features/ai-studio/services/menuSync.service.js";

async function main() {
  const singleId = process.argv[2]?.trim();
  if (!config.mongodbUrl) {
    console.error("MONGODB_URL is not set");
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUrl);

  const ids = singleId
    ? [singleId]
    : await MenuItem.distinct("restaurantId").then((list) => list.map(String));

  if (!ids.length) {
    console.log("No restaurants with menu items found.");
    await mongoose.disconnect();
    return;
  }

  for (const rid of ids) {
    try {
      const { rowCount, lastMenuSyncAt } = await syncMenuAndUpdateAgentMeta(rid);
      console.log("OK restaurantId=%s rows=%s lastMenuSyncAt=%s", rid, rowCount, lastMenuSyncAt || "");
    } catch (e) {
      console.error("FAIL restaurantId=%s", rid, e.message || e);
    }
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
