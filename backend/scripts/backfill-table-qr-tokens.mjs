/**
 * Ensures every table has qrToken + a unified guest QR (chat + cart + order).
 * Removes deprecated aiChatQr* fields from MongoDB if present.
 *
 * Usage (from backend/): npm run backfill:table-qr
 * Requires MONGODB_URL, APP_URL or CLIENT_URL for QR link targets.
 */

import "dotenv/config";
import mongoose from "mongoose";
import config from "../src/config/config.js";
import Table from "../src/models/Table.js";
import { newUrlSafeToken } from "../src/utils/secureTokens.js";
import { generateUnifiedTableQRCode } from "../src/utils/qrCode.js";

const appUrl = config.appUrl || config.clientUrl || "http://localhost:3000";

async function ensureUniqueQrToken() {
  for (let i = 0; i < 12; i++) {
    const t = newUrlSafeToken();
    const clash = await Table.findOne({ qrToken: t }).lean();
    if (!clash) return t;
  }
  throw new Error("Could not allocate unique qrToken");
}

async function main() {
  if (!config.mongodbUrl) {
    console.error("MONGODB_URL is not set");
    process.exit(1);
  }
  await mongoose.connect(config.mongodbUrl);
  const tables = await Table.find({});
  let updated = 0;
  for (const table of tables) {
    let changed = false;
    if (!table.qrToken) {
      table.qrToken = await ensureUniqueQrToken();
      changed = true;
    }
    const { qrDataUrl, qrLink } = await generateUnifiedTableQRCode(table.qrToken, { appUrl });
    table.qrCode = qrDataUrl;
    table.qrLink = qrLink;
    changed = true;

    await table.save();
    await Table.collection.updateOne(
      { _id: table._id },
      { $unset: { aiChatQrCode: "", aiChatQrLink: "" } }
    );
    updated += 1;
  }
  console.log(`Processed ${tables.length} tables, refreshed QR for ${updated}.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
