import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_MODEL = "claude-sonnet-4-6";

export interface ProductInput {
  title: string;
  material?: string;
  gemstone?: string;
  weight?: string;
  dimensions?: string;
  collection?: string;
  tags?: string[];
  careInstructions?: string;
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
  const lines = [`Produkttitel: ${product.title}`];
  if (product.material) lines.push(`Material: ${product.material}`);
  if (product.gemstone) lines.push(`Edelstein: ${product.gemstone}`);
  if (product.weight) lines.push(`Gewicht: ${product.weight}`);
  if (product.dimensions) lines.push(`Maße: ${product.dimensions}`);
  if (product.collection) lines.push(`Kollektion: ${product.collection}`);
  if (product.tags?.length) lines.push(`Schlagwörter: ${product.tags.join(", ")}`);
  if (product.careInstructions) lines.push(`Pflegehinweise: ${product.careInstructions}`);
  if (product.extraContext) lines.push(`Zusätzlicher Kontext: ${product.extraContext}`);
  lines.push("\nSchreibe die Produktbeschreibung.");
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

export interface SeoFields {
  title: string;       // <= 60 chars — used as Shopify seo.title
  description: string; // <= 155 chars — used as Shopify seo.description
  imageAlt: string;    // <= 125 chars — accessible alt text for the main image
}

const SEO_SYSTEM = `Du bist SEO-Texter für Jewelkunst (jewelkunst.net), eine Boutique-Schmuckmarke. Schreibe ausschließlich auf Deutsch, klar und ohne Werbe-Floskeln.
Gib AUSSCHLIESSLICH ein JSON-Objekt zurück, ohne Markdown, ohne Kommentar:
{"title": "...", "description": "...", "imageAlt": "..."}
- title: Meta-Titel, max. 60 Zeichen, enthält den Produktnamen und ein zentrales Material/Merkmal.
- description: Meta-Beschreibung, max. 155 Zeichen, ein vollständiger Satz, der zum Klicken einlädt.
- imageAlt: sachlicher Alt-Text fürs Hauptbild, max. 125 Zeichen, beschreibt das Stück konkret.`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in SEO response: ${text.slice(0, 120)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateSeo(
  client: Anthropic,
  product: ProductInput,
  model = process.env.CLAUDE_MODEL ?? DEFAULT_MODEL
): Promise<SeoFields> {
  const message = await client.messages.create({
    model,
    max_tokens: 300,
    system: SEO_SYSTEM,
    messages: [{ role: "user", content: buildUserMessage(product) }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected response block type: ${block.type}`);
  }

  const parsed = extractJson(block.text) as Partial<SeoFields>;
  const clip = (s: unknown, n: number): string =>
    typeof s === "string" ? s.trim().slice(0, n) : "";

  return {
    title: clip(parsed.title, 60),
    description: clip(parsed.description, 155),
    imageAlt: clip(parsed.imageAlt, 125),
  };
}
