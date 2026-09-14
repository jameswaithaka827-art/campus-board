import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";

type ChatTurn = { role: "user" | "assistant"; content: string | Array<Record<string, unknown>> };

type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

function provider() {
  return (process.env.AI_PROVIDER || "openai").toLowerCase();
}

function openAiModel() {
  return process.env.OPENAI_MODEL || "gpt-5.6-luna";
}

async function openAiResponse(params: {
  instructions?: string;
  input: unknown;
  maxOutputTokens: number;
  jsonSchema?: JsonSchema;
  webSearch?: boolean;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const body: Record<string, unknown> = {
    model: openAiModel(),
    store: false,
    input: params.input,
    max_output_tokens: params.maxOutputTokens,
  };
  if (params.instructions) body.instructions = params.instructions;
  if (params.webSearch) body.tools = [{ type: "web_search" }];
  if (params.jsonSchema) {
    body.text = {
      format: {
        type: "json_schema",
        name: params.jsonSchema.name,
        strict: true,
        schema: params.jsonSchema.schema,
      },
      verbosity: "low",
    };
  } else {
    body.text = { verbosity: "low" };
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as { output_text?: string };
  const text = data.output_text?.trim();
  if (!text) throw new Error("OpenAI returned no text output");
  return text;
}

export async function generateText(params: {
  instructions?: string;
  input: unknown;
  maxOutputTokens: number;
  webSearch?: boolean;
}) {
  if (provider() === "anthropic") {
    const anthropic = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
    const messages: ChatTurn[] = Array.isArray(params.input)
      ? (params.input as ChatTurn[])
      : [{ role: "user", content: String(params.input) }];
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: params.maxOutputTokens,
      // Top-level cache_control is real and current — verified directly
      // against @anthropic-ai/sdk 0.124.0's own type definitions, not
      // assumed: MessageCreateParamsBase includes
      // `cache_control?: CacheControlEphemeral | null` with the SDK's own
      // doc comment reading "Top-level cache control automatically applies
      // a cache_control marker to the last cacheable block in the
      // request." This is the officially documented pattern for growing
      // multi-turn conversations — Anthropic finds and advances the
      // breakpoint itself as history grows, covering the system prompt AND
      // the full accumulated message list in one field. Marking only the
      // system block (as a prior pass here did, believing this field
      // didn't exist) caches the prompt but not the conversation itself —
      // missing the actual cost driver for a chat feature that resends up
      // to 40 turns of history every message. Only pays off once the
      // cached prefix crosses roughly 1,024 tokens; short one-off calls
      // just don't hit that floor, which is harmless.
      cache_control: { type: "ephemeral" },
      ...(params.instructions ? { system: params.instructions } : {}),
      // ChatTurn's `content` is intentionally loose (string | generic array) so
      // every caller doesn't need to import Anthropic's block types just to
      // build a message. The actual shape callers pass (text or image blocks)
      // already matches what the SDK expects at runtime; this cast just tells
      // TypeScript that, since ChatTurn itself can't statically prove it.
      messages: messages as Anthropic.Messages.MessageParam[],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!text) throw new Error("Anthropic returned no text output");
    return text;
  }

  return openAiResponse(params);
}

export async function generateJson(params: {
  instructions: string;
  input: string;
  maxOutputTokens: number;
  schema: JsonSchema;
}) {
  if (provider() === "anthropic") {
    return generateText({ instructions: params.instructions, input: params.input, maxOutputTokens: params.maxOutputTokens });
  }
  return openAiResponse({
    instructions: params.instructions,
    input: params.input,
    maxOutputTokens: params.maxOutputTokens,
    jsonSchema: params.schema,
  });
}


/** Internet-backed answer for questions where freshness matters. */
export async function generateWebAnswer(params: {
  input: string;
  maxOutputTokens: number;
}) {
  if (provider() === "anthropic") {
    // Keep the same interface when Anthropic is selected; Anthropic deployments
    // can still answer normally, while OpenAI provides the built-in web tool.
    return generateText({
      instructions:
        "Answer clearly and flag when information may be outdated. Do not claim to have browsed the web.",
      input: params.input,
      maxOutputTokens: params.maxOutputTokens,
    });
  }

  return openAiResponse({
    instructions:
      "You are the web-enabled research assistant inside James AI. " +
      "Use web search when needed for current facts. Give a concise, accurate answer. " +
      "When web sources are available, mention that the answer was checked against current web sources.",
    input: params.input,
    maxOutputTokens: params.maxOutputTokens,
    webSearch: true,
  });
}

export async function generateVisionText(params: {
  instructions?: string;
  prompt: string;
  images: string[];
  maxOutputTokens: number;
}) {
  if (provider() !== "openai") {
    throw new Error("IMAGE_AI_REQUIRES_OPENAI");
  }
  const input = [
    { type: "input_text", text: params.prompt },
    ...params.images.map((image) => ({ type: "input_image", image_url: image })),
  ];
  return openAiResponse({
    instructions: params.instructions,
    input: input as unknown as Array<Record<string, unknown>>,
    maxOutputTokens: params.maxOutputTokens,
  });
}
