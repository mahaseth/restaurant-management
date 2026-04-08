import {
  getAiStudioOpenAIClient,
  getEmbeddingDimensions,
  getEmbeddingModelId,
} from "./aiStudioOpenai.provider.js";

const BATCH = 64;

/**
 * @param {string[]} inputs
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(inputs) {
  if (inputs.length === 0) return [];
  const openai = getAiStudioOpenAIClient();
  const model = getEmbeddingModelId();
  const expectedDim = getEmbeddingDimensions();
  const all = [];

  for (let i = 0; i < inputs.length; i += BATCH) {
    const batch = inputs.slice(i, i + BATCH);
    const res = await openai.embeddings.create({
      model,
      input: batch,
    });
    for (const item of res.data) {
      const v = item.embedding;
      if (!Array.isArray(v) || v.length !== expectedDim) {
        throw new Error(
          `Invalid embedding dimension: expected ${expectedDim} (set AZURE_EMBEDDING_DIMENSIONS if your model differs). Got ${v?.length ?? 0}.`
        );
      }
      all.push(v);
    }
  }
  return all;
}

export function getEmbeddingModelName() {
  return getEmbeddingModelId();
}

export { getEmbeddingDimensions, usesAzureOpenAI } from "./aiStudioOpenai.provider.js";
