import OpenAI from "openai";
import { AzureOpenAI } from "openai/azure";
import config from "../../../config/config.js";

/** @type {OpenAI | import("openai/azure").AzureOpenAI | null} */
let sharedClient = null;

/**
 * Azure is used when API key + endpoint (resource name or full URL) are set.
 * Otherwise falls back to OpenAI (OPENAI_API_KEY).
 */
export function usesAzureOpenAI() {
  const a = config.azureOpenAI;
  return Boolean(a?.apiKey && (a.resourceName || a.endpoint));
}

function resolveAzureEndpoint() {
  const a = config.azureOpenAI;
  if (a.endpoint) return a.endpoint.endsWith("/") ? a.endpoint : `${a.endpoint}/`;
  if (a.resourceName) return `https://${a.resourceName}.openai.azure.com/`;
  return null;
}

/**
 * Single client for embeddings + chat. On Azure, pass deployment name as `model` on each call.
 */
export function getAiStudioOpenAIClient() {
  if (sharedClient) return sharedClient;

  if (usesAzureOpenAI()) {
    const endpoint = resolveAzureEndpoint();
    if (!endpoint) {
      throw new Error("Azure OpenAI: set AZURE_RESOURCE_NAME or AZURE_OPENAI_ENDPOINT.");
    }
    const apiVersion = config.azureOpenAI.apiVersion || "2024-10-21";
    sharedClient = new AzureOpenAI({
      apiKey: config.azureOpenAI.apiKey,
      endpoint,
      apiVersion,
    });
    return sharedClient;
  }

  if (!config.openai?.apiKey) {
    throw new Error(
      "Configure AI: set AZURE_OPENAI_API_KEY + AZURE_RESOURCE_NAME (Azure), or OPENAI_API_KEY (OpenAI)."
    );
  }
  sharedClient = new OpenAI({ apiKey: config.openai.apiKey });
  return sharedClient;
}

/** Model id (OpenAI) or deployment name (Azure) for text-embedding-3-small (or your deployment). */
export function getEmbeddingModelId() {
  if (usesAzureOpenAI()) {
    return config.azureOpenAI.embeddingDeployment || "text-embedding-3-small";
  }
  return "text-embedding-3-small";
}

/** Model id (OpenAI) or deployment name (Azure) for chat. */
export function getChatModelId() {
  if (usesAzureOpenAI()) {
    return config.azureOpenAI.chatDeployment || config.openai.chatModel || "gpt-4o";
  }
  return config.openai.chatModel || "gpt-4o";
}

/** Expected vector size for menu rows (must match embedding model). Default 1536 for text-embedding-3-small. */
export function getEmbeddingDimensions() {
  const n = parseInt(String(config.azureOpenAI.embeddingDimensions || process.env.AZURE_EMBEDDING_DIMENSIONS || "1536"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1536;
}
