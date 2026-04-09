import { randomUUID } from "crypto";
import MenuItem from "../../../models/MenuItem.js";
import RestaurantAiAgent from "../../../models/RestaurantAiAgent.js";
import { embedTexts } from "./embedding.service.js";
import { replaceMenuRows } from "./supabaseMenu.repository.js";

const CATEGORY_DISPLAY = {
  appetizer: "Appetizer",
  main: "Main Course",
  dessert: "Dessert",
  drink: "Drink",
  side: "Side",
};

function resolveMenuItemImageUrl(item) {
  const candidates = [item?.image, item?.imageUrl, item?.photoUrl, item?.img];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function categoryDisplay(cat) {
  return CATEGORY_DISPLAY[cat] || cat || "Unknown";
}

/**
 * Rich plain text for embedding + model context (one block per dish).
 */
export function buildMenuItemEmbeddingText(item) {
  const image = resolveMenuItemImageUrl(item);
  const parts = [
    `${item.name}.`,
    `Category: ${categoryDisplay(item.category)}.`,
    `Description: ${String(item.description || "").trim() || "—"}.`,
  ];

  const ing = Array.isArray(item.ingredients) && item.ingredients.length ? item.ingredients.join(", ") : "";
  if (ing) parts.push(`Ingredients: ${ing}.`);

  const alg = Array.isArray(item.allergens) && item.allergens.length ? item.allergens.join(", ") : "";
  if (alg) parts.push(`Allergens: ${alg}.`);

  const dt = Array.isArray(item.dietaryTags) && item.dietaryTags.length ? item.dietaryTags.join(", ") : "";
  if (dt) parts.push(`Dietary tags: ${dt}.`);

  if (item.spiceLevel) parts.push(`Spice level: ${item.spiceLevel}.`);

  const cuis = typeof item.cuisineType === "string" && item.cuisineType.trim();
  if (cuis) parts.push(`Cuisine: ${cuis.trim()}.`);

  parts.push(`Price: ${item.price}.`);
  parts.push(`Available: ${item.available ? "yes" : "no"}.`);
  parts.push(image ? `Image URL: ${image}` : "Image URL: (none)");

  return parts.join(" ");
}

function rowAttributes(item) {
  const imageUrl = resolveMenuItemImageUrl(item);
  return {
    name: item.name,
    category: item.category,
    price: item.price,
    available: item.available,
    menuItemId: item._id?.toString?.() ?? String(item._id),
    imageUrl,
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    allergens: Array.isArray(item.allergens) ? item.allergens : [],
    dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
    spiceLevel: item.spiceLevel || null,
    cuisineType: typeof item.cuisineType === "string" ? item.cuisineType : "",
  };
}

/**
 * Full replace of vectorized menu for a restaurant (overwrites existing vectors).
 */
export async function syncMenuForRestaurant(restaurantId) {
  const rid = typeof restaurantId === "string" ? restaurantId : restaurantId.toString();
  const items = await MenuItem.find({ restaurantId: rid }).lean();
  if (items.length === 0) {
    await replaceMenuRows(rid, []);
    return { rowCount: 0 };
  }

  const contents = items.map((it) => buildMenuItemEmbeddingText(it));
  const embeddings = await embedTexts(contents);

  const rows = items.map((item, i) => ({
    id: randomUUID(),
    menuItemId: item._id.toString(),
    content: contents[i],
    embedding: embeddings[i],
    imageUrl: resolveMenuItemImageUrl(item),
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
