import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_MODEL = "claude-sonnet-4-6";

export interface ProductInput {
  title: string;
  material?: string;
  dimensions?: string;
  collection?: string;
  extraContext?: string;
}

let systemPrompt: string | null = null;

function loadSystemPrompt(): string {
  if (!systemPrompt) {
    const promptPath = path.join(__dirname, "../prompts/system.txt");
    systemPrompt = fs.readFileSync(promptPath, "utf-8").trim();
  }
  return systemPrompt;
}

function buildUserMessage(product: ProductInput): string {
  const lines = [`Product title: ${product.title}`];
  if (product.material) lines.push(`Material: ${product.material}`);
  if (product.dimensions) lines.push(`Dimensions/weight: ${product.dimensions}`);
  if (product.collection) lines.push(`Collection: ${product.collection}`);
  if (product.extraContext) lines.push(`Additional context: ${product.extraContext}`);
  lines.push("\nWrite the product description.");
  return lines.join("\n");
}

export async function generateDescription(
  client: Anthropic,
  product: ProductInput,
  model = process.env.CLAUDE_MODEL ?? DEFAULT_MODEL
): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: 400,
    system: loadSystemPrompt(),
    messages: [{ role: "user", content: buildUserMessage(product) }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected response block type: ${block.type}`);
  }
  return block.text.trim();
}
