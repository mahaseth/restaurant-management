import { embedTexts } from "./embedding.service.js";
import { searchSimilar } from "./supabaseMenu.repository.js";
import { mergeChatTheme } from "./chatBranding.service.js";
import { getAiStudioOpenAIClient, getChatModelId } from "./aiStudioOpenai.provider.js";
import MenuItem from "../../../models/MenuItem.js";
import {
  extractMenuRecommendationsFromAssistantText,
  inferMenuRecommendationsFromReply,
  normalizeMenuImageUrl,
  parseMenuCatalogAttributes,
  fallbackRecommendationsFromContextRows,
  isBroadMenuIntentUserMessage,
} from "./menuRecommendations.util.js";
import { applyRetrievalKeywordBoost } from "./menuRetrievalBoost.util.js";
import { detectMenuQueryIntent, computeRetrievalConfidence, buildMatchedMenuItemsSummary } from "./menuRagConfidence.util.js";

const TONE_GUIDANCE = {
  professional: "Use a polished, professional tone appropriate for hospitality.",
  friendly: "Be warm, approachable, and helpful.",
  warm: "Use inviting language that makes guests feel welcome.",
  playful: "A light, upbeat tone is fine when appropriate; stay tasteful and family-friendly.",
  formal: "Use courteous, refined language.",
  luxury: "Convey attentive, premium service without being stiff.",
};

const LENGTH_GUIDANCE = {
  concise:
    "Keep replies to at most 2–3 short sentences unless the user clearly asks for more detail.",
  default: "Keep replies concise unless the user asks for more detail.",
  verbose: "You may give richer explanations when it helps the guest choose dishes or understand options.",
};
const RETRIEVAL_LIMIT = 5;
/** Fetch extra neighbors from pgvector, then keyword-boost and trim to RETRIEVAL_LIMIT. */
const RETRIEVAL_PREFETCH = 12;
const FALLBACK_CARD_LIMIT = 6;
/** Match table session history cap so clarifier sees the same thread as the reply model. */
const CLARIFIER_MAX_PRIOR_MESSAGES = 80;
const CLARIFIER_MAX_TOKENS = 80;

/**
 * Clarify the user's latest message into a retrieval query using conversation history.
 * This is retrieval-only text (not shown to guest), used before embedding + vector similarity.
 */
async function clarifyQueryForRetrieval({ openai, model, priorMessages, userText }) {
  const history = (priorMessages || [])
    .slice(-CLARIFIER_MAX_PRIOR_MESSAGES)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
    }));
  const messages = [
    {
      role: "system",
      content:
        "You receive the prior conversation between the guest and the assistant (in order), then the guest's latest message as the final user turn. " +
        "Rewrite only that latest guest message into one concise retrieval query for restaurant menu lookup. " +
        "Use the full transcript to resolve pronouns, references, and ellipsis. Keep dish names, cuisine, dietary needs, and constraints. " +
        "No markdown, no bullets, no explanations. Output exactly one plain-text line.",
    },
    ...history,
    { role: "user", content: userText },
  ];
  try {
    const rs = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0,
      max_tokens: CLARIFIER_MAX_TOKENS,
    });
    const clarified = rs.choices[0]?.message?.content?.trim();
    return clarified || userText;
  } catch {
    return userText;
  }
}

function buildSystemPrompt(agent, restaurantName, contextBlock, promptOptions = {}) {
  const { strictIntentFocus = false } = promptOptions;
  const theme = mergeChatTheme(agent.chatTheme || {});
  const discountOn = Boolean(theme.discountEnabled);
  const pct = theme.discountPercent || "5%";

  const rs = agent.responseStyle === "concise" || agent.responseStyle === "verbose" ? agent.responseStyle : "default";
  const toneKey = String(agent.agentTone || "friendly").toLowerCase();
  const toneLine = TONE_GUIDANCE[toneKey] || `Adopt a ${agent.agentTone || "friendly"} tone suitable for a restaurant guest.`;
  const lengthLine = LENGTH_GUIDANCE[rs] || LENGTH_GUIDANCE.default;

  const displayName = typeof agent.agentDisplayName === "string" ? agent.agentDisplayName.trim() : "";
  let displayNameSection = "";
  if (displayName) {
    displayNameSection = agent.omitAgentName
      ? `\nIDENTITY: The label "${displayName}" in the chat is this assistant's name, not the restaurant or brand. The business you represent is "${restaurantName}". Do not use "${displayName}" as the venue, company, or product brand. Do not refer to yourself by name in replies (as configured).\n`
      : `\nIDENTITY: "${displayName}" is the chat assistant's own name (your persona in this app), not the restaurant. The business you speak for is "${restaurantName}". If these differ, never use "${displayName}" as the shop, brand, or company name. Use "we/our" for the venue "${restaurantName}"; use "${displayName}" only as yourself when a short "I" fit is natural — not as a business or trademark.\n`;
  }

  const story = typeof agent.brandStory === "string" ? agent.brandStory.trim() : "";
  const extra = typeof agent.customInstructions === "string" ? agent.customInstructions.trim() : "";

  let prompt = `You are a restaurant assistant for "${restaurantName}". You speak on behalf of the restaurant team.${displayNameSection}

CONFIGURED SETTINGS (AI Studio — follow on every reply):
- Tone, response length, brand story, and operator rules below are set by the venue. Apply them together with the technical policies that follow.
- Where brand or operator guidance conflicts with generic phrasing elsewhere in this prompt, prefer the owner's brand story and operator rules — except for allergen/dietary safety and facts: never contradict safety rules, and never invent dishes or prices that are not in the MENU CONTEXT at the end.

VOICE & LENGTH (from restaurant settings):
- ${toneLine}
- ${lengthLine}
`;

  if (story) {
    prompt += `
BRAND & POSITIONING (from owner):
${story}
`;
  }

  if (extra) {
    prompt += `
OPERATOR RULES (from owner — follow these):
${extra}
`;
  }

  if (agent.omitAgentName && !displayName) {
    prompt += `
Do not refer to yourself by name in your replies.
`;
  }

  prompt += `GROUNDING (required):
- Treat the MENU CONTEXT at the end of this prompt as the only source of truth for specific dishes, prices, availability, ingredients, allergens, dietary tags, spice level, and cuisine type.
- Do not invent menu items, prices, or ingredients. If something is not in the MENU CONTEXT, do not claim we serve it.
- If ingredient, allergen, or dietary information is missing from the MENU CONTEXT for a dish, say it is not shown in our menu details here — never guess, infer, or imply safety.
- Recommendations must be grounded in retrieved lines (names, tags, ingredients). Prefer dishes clearly supported by the context.

MENU FACTS:
- Use only the MENU CONTEXT at the end when discussing specific dishes, prices, availability, ingredients, allergens, dietary tags, spice level, or cuisine type.
- Do not invent items or prices not supported by the context.
- If the context does not mention something, do not claim it exists. Frame limits in our voice: what we offer vs. what is not on our menu or not available here — not as a generic "I don't know" or "I don't have information."
- Avoid phrases like "I don't have information about that," "I don't have access to…," or "As an AI…." Instead use warm, first-plural wording, for example: we're not serving that right now / that's not on our menu / we'd suggest asking our team when you're here / here's what we do have that might work.
- When unsure or the menu context is thin, invite the guest to check with staff on site rather than apologizing with empty disclaimers.

ALLERGENS, DIETARY & SAFETY:
- Treat allergen and ingredient information as safety-critical. Only state allergens or ingredients that appear explicitly in the MENU CONTEXT for that dish.
- If the guest asks about allergens (e.g. peanuts, dairy, gluten) or dietary needs (e.g. vegan, halal) and the MENU CONTEXT does not list that information for a dish, say clearly that those details are not shown on our menu here and they should confirm with our staff before ordering — do not guess or assume.
- Never state or imply that a dish is "safe" for an allergy or diet unless the MENU CONTEXT explicitly supports it (e.g. listed allergens/tags/ingredients). When in doubt, defer to staff.
- For dietary recommendations (vegetarian, gluten-free, etc.), only suggest dishes whose MENU CONTEXT lines include matching dietary tags or clearly support the claim from listed ingredients. If nothing matches, say we don't have a labeled option in context and offer staff assistance.
- Never invent spice level, cuisine, allergens, or dietary tags — if missing from context, acknowledge that it is not available in the menu data we have.

RESTAURANT VOICE (we / us / our):
- Prefer "we," "our," and "us" when talking about the restaurant, food, hours, policies, and recommendations. Sound like a helpful member of the team, not a detached chatbot.
- Use "I" sparingly; it is fine for short bridges ("I can help you find…") but default to "we" for what the restaurant serves and stands for.

LANGUAGE BEHAVIOR:
- Detect the guest's language from their latest message and reply in that same language by default.
- If the guest mixes languages, mirror their dominant language and keep wording natural.
- If the guest asks for a different language, switch immediately.

ORDERING & "WHAT'S NEXT":
- When the guest asks what to do next, how to order, or how to place an order after they've picked dishes (e.g. "what next?", "how do I order?", "I've chosen X"), answer in our team voice.
- Explain that they can add items to their cart and tap Place order on this same table session screen, and/or flag down our staff to order.
- Do not imply you submit payments or create orders yourself; the guest uses the cart and order buttons in the app. Do not invent apps, phone numbers, or URLs unless they appear in MENU CONTEXT or operator rules.
- When the guest has chosen dishes, nudge them to add favorites to the cart from the recommendation cards or menu and place the order when ready.

MENU IMAGES & DISH CARDS (guest chat UI):
- MENU CONTEXT entries include [menu_item_id: …] and an "Image URL (use when recommending):" line. Copy those URLs exactly into the JSON trailer so thumbnails load.
- Do not use markdown (no **asterisks** or # headings). Write dish names in plain text so guests never see raw ** symbols.

LISTING MULTIPLE DISHES (required):
- If you mention two or more dishes, use a numbered or dashed list with ONE dish per line (never one long paragraph listing several items).
- Example:
  1. Momo — $25
  2. Chicken Thali Biryani — $3

- When you list or recommend specific dishes, after your reply add exactly one new line (no markdown code fences) containing:
  :::menu_recommendations:::[{"menuItemId":"<id from context>","name":"<dish name>","price":<number>,"imageUrl":"<exact image URL from context or empty string>"}]
- Use valid JSON array (minified). Include every dish you name in the reply. Copy menuItemId and imageUrl exactly from MENU CONTEXT. If a dish has no image, use "imageUrl":"".
- If you are not naming concrete dishes, omit the :::menu_recommendations::: line entirely.
`;

  if (discountOn) {
    prompt += `

DISCOUNT / VOUCHER RULES:
- The restaurant offers an exclusive discount (${pct}) for customers using this chat, as described in the theme.
- There is no "end chat" or separate voucher button in the guest app: explain that they claim the benefit with the team (e.g. mention the discount to staff, as in the theme copy).
- To receive voucher benefits, tell the guest to call a friendly staff member and claim the discount voucher; our team will assist with the claim.
- If relevant, end your message with a line containing exactly: [discount_voucher]
- Do not promise items that are not in the menu context.`;
  }

  if (strictIntentFocus) {
    prompt += `

STRICT MODE (this turn):
- The guest asked about allergens, dietary restrictions, or ingredients. Follow ALLERGENS, DIETARY & SAFETY above with zero tolerance for guessing.
- If MENU CONTEXT does not clearly answer the question, say our menu details don't show that here and ask them to confirm with staff before ordering.`;
  }

  prompt += `

MENU CONTEXT (authoritative for menu facts — read last):
${contextBlock || "(no menu rows retrieved)"}`;

  return prompt;
}

function formatMenuContextRows(rows) {
  return rows
    .map((r) => {
      const attrs = parseMenuCatalogAttributes(r);
      const id = attrs.menuItemId || "";
      const directImage = typeof r?.image_url === "string" ? r.image_url : "";
      const attrsImage = typeof attrs.imageUrl === "string" ? attrs.imageUrl : "";
      const img = normalizeMenuImageUrl(directImage || attrsImage);
      const header = `[menu_item_id: ${id}]`;
      const imgLine = img ? `Image URL (use when recommending): ${img}` : "Image URL (use when recommending): (none)";
      return [header, r.content, imgLine].join("\n");
    })
    .filter(Boolean)
    .join("\n---\n");
}

function buildAssistantUiMetadata(menuRecommendations) {
  const hasRecs = Array.isArray(menuRecommendations) && menuRecommendations.length > 0;
  const suggestedActions = [
    { id: "view_cart", label: "View cart", action: "VIEW_CART" },
    { id: "place_order", label: "Place order", action: "PLACE_ORDER" },
    { id: "order_status", label: "Order status", action: "ORDER_STATUS" },
  ];
  if (hasRecs) {
    suggestedActions.unshift({ id: "focus_menu", label: "Menu picks", action: "FOCUS_RECOMMENDATIONS" });
  }
  const quickReplies = [
    { label: "Popular dishes", prompt: "What are your most popular dishes?" },
    { label: "Something light", prompt: "What would you recommend that's light or healthy?" },
  ];
  return { suggestedActions, quickReplies };
}

async function fillMissingRecommendationImages(menuRecommendations, restaurantId) {
  if (!Array.isArray(menuRecommendations) || menuRecommendations.length === 0) return menuRecommendations;
  const missingIds = menuRecommendations
    .filter((r) => !normalizeMenuImageUrl(r.imageUrl))
    .map((r) => r.menuItemId)
    .filter(Boolean);
  if (!missingIds.length) return menuRecommendations;

  const docs = await MenuItem.find({ restaurantId, _id: { $in: missingIds } })
    .select("_id image imageUrl")
    .lean();
  const imageById = new Map(
    docs.map((d) => {
      const raw = d?.image || d?.imageUrl || "";
      return [String(d._id), normalizeMenuImageUrl(typeof raw === "string" ? raw : "")];
    })
  );

  return menuRecommendations.map((r) => ({
    ...r,
    imageUrl: normalizeMenuImageUrl(r.imageUrl) || imageById.get(String(r.menuItemId)) || "",
  }));
}

/**
 * @param {import("mongoose").Document} agent
 * @param {string} userText
 * @param {{
 *   listPriorTurns: () => Promise<Array<{ role: string, content: string }>>,
 *   persistExchange: (userText: string, assistantPayload: { content: string, menuRecommendations?: unknown[], suggestedActions?: unknown[], quickReplies?: unknown[] }) => Promise<void>
 * }} persistence
 */
export async function handleChatMessage(agent, userText, persistence) {
  const restaurant = agent.restaurantId;
  const restaurantName =
    typeof restaurant === "object" && restaurant?.name ? restaurant.name : "our restaurant";
  const restaurantId =
    restaurant && typeof restaurant === "object" && restaurant._id
      ? restaurant._id.toString()
      : String(agent.restaurantId);

  const priorMessages = await persistence.listPriorTurns();
  const queryIntent = detectMenuQueryIntent(userText);

  const model = getChatModelId();
  const openai = getAiStudioOpenAIClient();
  const retrievalQuery = await clarifyQueryForRetrieval({
    openai,
    model,
    priorMessages,
    userText,
  });

  const [qEmb] = await embedTexts([retrievalQuery]);
  let contextRows = [];
  try {
    const fetched = await searchSimilar(restaurantId, qEmb, RETRIEVAL_PREFETCH);
    const boosted = applyRetrievalKeywordBoost(fetched, retrievalQuery, userText);
    contextRows = boosted.slice(0, RETRIEVAL_LIMIT);
  } catch (e) {
    console.error("[AI Chat] vector search failed", e.message);
  }

  const confidenceState = computeRetrievalConfidence(contextRows, queryIntent);
  const matchedMenuItems = buildMatchedMenuItemsSummary(contextRows);
  const fallbackUsed = false;

  if (process.env.MENU_RAG_DEBUG) {
    console.log(
      "[menu RAG]",
      JSON.stringify({
        userQuery: userText.slice(0, 500),
        retrievalQuery: retrievalQuery.slice(0, 500),
        queryIntent,
        confidence: confidenceState.confidence,
        topSimilarity: confidenceState.topSimilarity,
        thresholds: confidenceState.thresholds,
        matchedMenuItems,
      })
    );
  }

  const retrievalPayload = {
    confidence: confidenceState.confidence,
    fallbackUsed,
    matchedMenuItems,
    queryIntent,
    retrievalQuery,
    topSimilarity: confidenceState.topSimilarity,
    thresholdsUsed: confidenceState.thresholds,
  };

  const contextBlock = formatMenuContextRows(contextRows);

  const systemPrompt = buildSystemPrompt(agent, restaurantName, contextBlock, {
    strictIntentFocus: Boolean(queryIntent.strictSafetyMode || queryIntent.ingredientFocus),
  });

  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userText },
  ];

  const responseStyle =
    agent.responseStyle === "concise" || agent.responseStyle === "verbose" ? agent.responseStyle : "default";
  const maxTokens = responseStyle === "verbose" ? 1100 : 800;

  const completion = await openai.chat.completions.create({
    model,
    messages: chatMessages,
    temperature: 0.6,
    max_tokens: maxTokens,
  });

  const rawAssistant = completion.choices[0]?.message?.content?.trim() || "Sorry, I could not generate a reply.";
  let { text: assistantContent, menuRecommendations } = extractMenuRecommendationsFromAssistantText(rawAssistant);

  if (!menuRecommendations.length) {
    menuRecommendations = inferMenuRecommendationsFromReply(assistantContent, contextRows);
  }
  if (!menuRecommendations.length && contextRows.length && isBroadMenuIntentUserMessage(userText)) {
    menuRecommendations = fallbackRecommendationsFromContextRows(contextRows, FALLBACK_CARD_LIMIT);
  }
  menuRecommendations = await fillMissingRecommendationImages(menuRecommendations, restaurantId);

  const ui = buildAssistantUiMetadata(menuRecommendations);
  const assistantPayload = {
    content: assistantContent,
    ...(menuRecommendations.length ? { menuRecommendations } : {}),
    ...ui,
  };
  await persistence.persistExchange(userText, assistantPayload);

  return {
    assistantMessage: {
      content: assistantContent,
      messageId: Date.now(),
      ...(menuRecommendations.length ? { menuRecommendations } : {}),
      ...ui,
    },
    retrieval: retrievalPayload,
  };
}
