import { randomUUID } from "crypto";
import MenuItem from "../../../models/MenuItem.js";
import RestaurantAiAgent from "../../../models/RestaurantAiAgent.js";
import { embedTexts } from "./embedding.service.js";
import { replaceMenuRows } from "./supabaseMenu.repository.js";

function rowContent(item) {
  const image = typeof item.image === "string" && item.image.trim() ? item.image.trim() : "";
  const parts = [
    `Name: ${item.name}`,
    `Category: ${item.category}`,
    `Price: ${item.price}`,
    `Available: ${item.available ? "yes" : "no"}`,
    `Description: ${item.description || ""}`,
    image ? `Image URL: ${image}` : "Image URL: (none)",
  ];
  return parts.join("\n");
}

function rowAttributes(item) {
  const imageUrl = typeof item.image === "string" && item.image.trim() ? item.image.trim() : "";
  return {
    name: item.name,
    category: item.category,
    price: item.price,
    available: item.available,
    menuItemId: item._id?.toString?.() ?? String(item._id),
    imageUrl,
  };
}

/**
 * Full replace of vectorized menu for a restaurant.
 */
export async function syncMenuForRestaurant(restaurantId) {
  const rid = typeof restaurantId === "string" ? restaurantId : restaurantId.toString();
  const items = await MenuItem.find({ restaurantId: rid }).lean();
  if (items.length === 0) {
    await replaceMenuRows(rid, []);
    return { rowCount: 0 };
  }

  const contents = items.map(rowContent);
  const embeddings = await embedTexts(contents);

  const rows = items.map((item, i) => ({
    id: randomUUID(),
    menuItemId: item._id.toString(),
    content: contents[i],
    embedding: embeddings[i],
    attributes: rowAttributes(item),
  }));

  await replaceMenuRows(rid, rows);
  return { rowCount: rows.length };
}

/**
 * Rebuild embeddings for a restaurant and update AI Studio sync metadata on the agent (if any).
 * Used by manual sync and after menu create/update/delete/image changes.
 */
export async function syncMenuAndUpdateAgentMeta(restaurantId) {
  const rid = typeof restaurantId === "string" ? restaurantId : restaurantId.toString();
  try {
    const { rowCount } = await syncMenuForRestaurant(rid);
    const agent = await RestaurantAiAgent.findOne({ restaurantId: rid });
    if (agent) {
      agent.lastMenuSyncAt = new Date();
      agent.lastMenuSyncError = "";
      agent.menuRowCount = rowCount;
      await agent.save();
    }
    return { rowCount, lastMenuSyncAt: agent?.lastMenuSyncAt ?? null };
  } catch (e) {
    const agent = await RestaurantAiAgent.findOne({ restaurantId: rid });
    if (agent) {
      agent.lastMenuSyncError = e.message || String(e);
      await agent.save();
    }
    throw e;
  }
}
