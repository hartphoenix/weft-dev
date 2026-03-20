/**
 * Embedding function via LM Studio's OpenAI-compatible API.
 *
 * Calls /v1/embeddings on localhost:1234. Model: nomic-embed-text.
 * Returns 768-dim Float64 vectors.
 */

const LM_STUDIO_URL = process.env.INFERENCE_BASE_URL || "http://127.0.0.1:1234";
const EMBEDDING_MODEL = "text-embedding-nomic-embed-text-v1.5";

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Embed a single text string. Returns a 768-dim vector.
 */
export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${LM_STUDIO_URL}/v1/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: text, model: EMBEDDING_MODEL }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Embedding request failed (${res.status}): ${body.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as EmbeddingResponse;
  return json.data[0].embedding;
}

/**
 * Embed multiple texts in a single batch request.
 * Returns vectors in the same order as inputs.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // LM Studio supports batch embedding via array input
  const res = await fetch(`${LM_STUDIO_URL}/v1/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts, model: EMBEDDING_MODEL }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Batch embedding request failed (${res.status}): ${body.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as EmbeddingResponse;
  // Sort by index to guarantee order matches input
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/**
 * Check if LM Studio embedding endpoint is reachable.
 */
export async function checkEmbeddingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${LM_STUDIO_URL}/v1/models`);
    if (!res.ok) return false;
    const json = (await res.json()) as { data: Array<{ id: string }> };
    return json.data.some((m) => m.id.includes("nomic-embed"));
  } catch {
    return false;
  }
}
