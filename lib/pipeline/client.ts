import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/**
 * Shared Anthropic client for the extract and verify stages — the only two
 * places in the codebase that call the Anthropic SDK (architecture.md:
 * lib/pipeline/ "owns all Claude calls").
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
