/**
 * Generic extractor: takes raw document text + a docId, calls Claude Haiku,
 * returns parsed structured data or null.
 */
import Anthropic from "@anthropic-ai/sdk";
import { PROMPTS } from "./prompts";
import { extractJSON, truncateText } from "../utils";

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function extractDoc<T>(
  docId: string,
  rawText: string,
  verbose = false
): Promise<T | null> {
  const prompt = PROMPTS[docId];
  if (!prompt) {
    if (verbose) console.error(`[WARN] No prompt defined for docId: ${docId}`);
    return null;
  }

  const truncated = truncateText(rawText, 12000);

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: prompt.system,
      messages: [
        {
          role: "user",
          content: prompt.userPrefix + truncated,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    if (verbose) console.error(`[DEBUG] ${docId} raw response:\n${text}\n`);

    return extractJSON<T>(text);
  } catch (err) {
    if (verbose) console.error(`[ERROR] ${docId} extraction failed:`, err);
    return null;
  }
}
