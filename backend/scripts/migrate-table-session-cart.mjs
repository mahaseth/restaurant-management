/**
 * Backfills cart / order fields on existing TableChatSession documents (pre-unified schema).
 *
 * Usage (from backend/): npm run migrate:table-session-cart
 */

import "dotenv/config";
import mongoose from "mongoose";
import config from "../src/config/config.js";

async function main() {
  if (!config.mongodbUrl) {
    console.error("MONGODB_URL is not set");
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUrl);
  const col = mongoose.connection.collection("tablechatsessions");
  const r = await col.updateMany(
    { $or: [{ cart: { $exists: false } }, { cart: null }] },
    {
      $set: {
        cart: { items: [], subtotal: 0, updatedAt: new Date() },
      },
    }
  );
  console.log(`Matched ${r.matchedCount}, modified ${r.modifiedCount} sessions.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
