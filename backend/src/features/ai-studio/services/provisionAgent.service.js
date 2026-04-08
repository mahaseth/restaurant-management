import { nanoid } from "nanoid";
import RestaurantAiAgent from "../../../models/RestaurantAiAgent.js";
import { mergeChatTheme } from "./chatBranding.service.js";

async function uniqueSlug() {
  for (let i = 0; i < 8; i++) {
    const slug = nanoid(12);
    const exists = await RestaurantAiAgent.findOne({ publicSlug: slug }).lean();
    if (!exists) return slug;
  }
  throw new Error("Could not generate a unique chat slug.");
}

/**
 * Create or return existing agent for restaurant; optionally (re)provision slug when missing.
 */
export async function getOrProvisionAgent(restaurantId, { forceProvision = false } = {}) {
  const rid = typeof restaurantId === "string" ? restaurantId : restaurantId.toString();
  let agent = await RestaurantAiAgent.findOne({ restaurantId: rid });

  if (!agent) {
    const publicSlug = await uniqueSlug();
    agent = await RestaurantAiAgent.create({
      restaurantId: rid,
      publicSlug,
      enabled: true,
      provisionedAt: new Date(),
      chatTheme: mergeChatTheme({}),
    });
    return { agent, created: true };
  }

  if (forceProvision && !agent.enabled) {
    agent.enabled = true;
    agent.provisionedAt = new Date();
    await agent.save();
  }

  return { agent, created: false };
}

export async function findAgentBySlug(publicSlug) {
  if (!publicSlug || typeof publicSlug !== "string") return null;
  return RestaurantAiAgent.findOne({ publicSlug: publicSlug.trim(), enabled: true }).populate(
    "restaurantId",
    "name"
  );
}

export async function findAgentByRestaurantId(restaurantId) {
  const rid = typeof restaurantId === "string" ? restaurantId : restaurantId.toString();
  return RestaurantAiAgent.findOne({ restaurantId: rid });
}
