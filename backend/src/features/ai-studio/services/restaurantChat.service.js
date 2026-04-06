import { embedTexts } from "./embedding.service.js";
import { searchSimilar } from "./supabaseMenu.repository.js";
import { mergeChatTheme } from "./chatBranding.service.js";
import * as sessionStore from "./aiChatSession.store.js";
import { getAiStudioOpenAIClient, getChatModelId } from "./aiStudioOpenai.provider.js";
import {
  extractMenuRecommendationsFromAssistantText,
  inferMenuRecommendationsFromReply,
  normalizeMenuImageUrl,
  parseMenuCatalogAttributes,
  fallbackRecommendationsFromContextRows,
  isBroadMenuIntentUserMessage,
} from "./menuRecommendations.util.js";

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

function buildSystemPrompt(agent, restaurantName, contextBlock) {
  const theme = mergeChatTheme(agent.chatTheme || {});
  const discountOn = Boolean(theme.discountEnabled);
  const pct = theme.discountPercent || "5%";

  const rs = agent.responseStyle === "concise" || agent.responseStyle === "verbose" ? agent.responseStyle : "default";
  const toneKey = String(agent.agentTone || "friendly").toLowerCase();
  const toneLine = TONE_GUIDANCE[toneKey] || `Adopt a ${agent.agentTone || "friendly"} tone suitable for a restaurant guest.`;
  const lengthLine = LENGTH_GUIDANCE[rs] || LENGTH_GUIDANCE.default;

  let prompt = `You are a restaurant assistant for "${restaurantName}". You speak on behalf of the restaurant team.

MENU FACTS:
- Use only the MENU CONTEXT below when discussing specific dishes, prices, availability, or ingredients.
- Do not invent items or prices not supported by the context.
- If the context does not mention something, do not claim it exists. Frame limits in our voice: what we offer vs. what is not on our menu or not available here — not as a generic "I don't know" or "I don't have information."
- Avoid phrases like "I don't have information about that," "I don't have access to…," or "As an AI…." Instead use warm, first-plural wording, for example: we're not serving that right now / that's not on our menu / we'd suggest asking our team when you're here / here's what we do have that might work.
- When unsure or the menu context is thin, invite the guest to check with staff on site rather than apologizing with empty disclaimers.

RESTAURANT VOICE (we / us / our):
- Prefer "we," "our," and "us" when talking about the restaurant, food, hours, policies, and recommendations. Sound like a helpful member of the team, not a detached chatbot.
- Use "I" sparingly; it is fine for short bridges ("I can help you find…") but default to "we" for what the restaurant serves and stands for.

ORDERING & "WHAT'S NEXT":
- When the guest asks what to do next, how to order, or how to place an order after they've picked dishes (e.g. "what next?", "how do I order?", "I've chosen X"), answer in our team voice.
- Explain that they can place the order by scanning the QR code on their table to order from their table (when your venue offers table QR ordering), and/or they can flag down one of our friendly staff and ask them to place the order.
- Do not imply this chat places orders; ordering is via table QR or staff unless operator rules below say otherwise.
- Keep it warm and short; do not invent apps, phone numbers, or URLs unless they appear in MENU CONTEXT or operator rules.

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

VOICE & LENGTH:
- ${toneLine}
- ${lengthLine}

MENU CONTEXT:
${contextBlock || "(no menu rows retrieved)"}`;

  const story = typeof agent.brandStory === "string" ? agent.brandStory.trim() : "";
  if (story) {
    prompt += `

BRAND & POSITIONING:
${story}`;
  }

  const extra = typeof agent.customInstructions === "string" ? agent.customInstructions.trim() : "";
  if (extra) {
    prompt += `

OPERATOR RULES (follow these):
${extra}`;
  }

  if (agent.omitAgentName) {
    prompt += `

Do not refer to yourself by name in your replies.`;
  }

  if (discountOn) {
    prompt += `

DISCOUNT / VOUCHER RULES:
- The restaurant offers an exclusive discount (${pct}) for customers using this chat, as described in the theme.
- Explain how to get the voucher: the user should tap "${theme.endChatLabel || "End Chat"}" when they are done; a voucher screen will appear.
- If relevant, end your message with a line containing exactly: [discount_voucher]
- Do not promise items that are not in the menu context.`;
  }

  return prompt;
}

function formatMenuContextRows(rows) {
  return rows
    .map((r) => {
      const attrs = parseMenuCatalogAttributes(r);
      const id = attrs.menuItemId || "";
      const img = normalizeMenuImageUrl(typeof attrs.imageUrl === "string" ? attrs.imageUrl : "");
      const header = `[menu_item_id: ${id}]`;
      const imgLine = img ? `Image URL (use when recommending): ${img}` : "Image URL (use when recommending): (none)";
      return [header, r.content, imgLine].join("\n");
    })
    .filter(Boolean)
    .join("\n---\n");
}

/**
 * @param {import("mongoose").Document} agent
 * @param {string} userText
 * @param {string} sessionId
 */
export async function handleChatMessage(agent, userText, sessionId) {
  const restaurant = agent.restaurantId;
  const restaurantName =
    typeof restaurant === "object" && restaurant?.name ? restaurant.name : "our restaurant";
  const rid =
    restaurant && typeof restaurant === "object" && restaurant._id
      ? restaurant._id.toString()
      : String(agent.restaurantId);

  const [qEmb] = await embedTexts([userText]);
  let contextRows = [];
  try {
    contextRows = await searchSimilar(rid, qEmb, 8);
  } catch (e) {
    console.error("[AI Chat] vector search failed", e.message);
  }

  const contextBlock = formatMenuContextRows(contextRows);

  const systemPrompt = buildSystemPrompt(agent, restaurantName, contextBlock);

  sessionStore.ensureSession(sessionId, { restaurantId: rid, slug: agent.publicSlug });
  const prior = sessionStore.listMessages(sessionId);
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...prior.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userText },
  ];

  const rs = agent.responseStyle === "concise" || agent.responseStyle === "verbose" ? agent.responseStyle : "default";
  const maxTokens = rs === "verbose" ? 1100 : 800;

  const model = getChatModelId();
  const openai = getAiStudioOpenAIClient();
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
    menuRecommendations = fallbackRecommendationsFromContextRows(contextRows, 6);
  }

  sessionStore.appendMessage(sessionId, { role: "user", content: userText });
  sessionStore.appendMessage(sessionId, {
    role: "assistant",
    content: assistantContent,
    ...(menuRecommendations.length ? { menuRecommendations } : {}),
  });

  return {
    assistantMessage: {
      content: assistantContent,
      messageId: Date.now(),
      ...(menuRecommendations.length ? { menuRecommendations } : {}),
    },
  };
}
