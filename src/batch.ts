/**
 * Batch description generator.
 *
 * Usage:
 *   npm run batch -- [--dry-run] [--limit N] [--skip-existing] [--model NAME]
 *
 * Run `npm run batch -- --help` for the full option list.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { generateDescription, generateSeo, type ProductInput } from "./generate.js";
import {
  fetchAllProducts,
  updateProductDescription,
  setProductJsonLd,
  type ShopifyProduct,
} from "./shopify.js";
import { buildProductJsonLd, htmlToPlainText } from "./jsonld.js";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function flagValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const HELP = `Jewelkunst AI Description Generator

Usage:
  npm run batch -- [options]
  DRY_RUN=true npm run batch

Options:
  --dry-run         Generate descriptions but do NOT write them to Shopify.
  --limit N         Process at most N products (good for test runs).
  --skip-existing   Skip products that already have a description.
  --seo             Also generate SEO meta title + description (and image
                    alt text) and write seo.title/seo.description to Shopify.
  --json-ld         Build schema.org/Product JSON-LD and store it in the
                    product metafield seo.json_ld (for rich snippets).
  --model NAME      Claude model to use. Overrides CLAUDE_MODEL.
                    Default: claude-sonnet-4-6.
                    Tip: claude-haiku-4-5-20251001 for cheap bulk runs.
  -h, --help        Show this help and exit.

Environment (.env):
  ANTHROPIC_API_KEY, SHOPIFY_SHOP_DOMAIN, SHOPIFY_ACCESS_TOKEN
  Optional: CLAUDE_MODEL, BATCH_SIZE (default 5), DRY_RUN
`;

if (hasFlag("--help") || hasFlag("-h")) {
  console.log(HELP);
  process.exit(0);
}

const DRY_RUN = hasFlag("--dry-run") || process.env.DRY_RUN === "true";
const SKIP_EXISTING = hasFlag("--skip-existing");
const WITH_SEO = hasFlag("--seo");
const WITH_JSONLD = hasFlag("--json-ld");
const LIMIT = (() => {
  const v = flagValue("--limit");
  return v !== undefined ? parseInt(v, 10) : Infinity;
})();
const MODEL = flagValue("--model") ?? process.env.CLAUDE_MODEL;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "5", 10);
const OUTPUT_DIR = "output";
const BACKUP_DIR = path.join(OUTPUT_DIR, "backups");
const LOG_FILE = path.join(OUTPUT_DIR, "update-log.jsonl");

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function ensureDirs() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function saveBackup(products: ShopifyProduct[]) {
  const file = path.join(BACKUP_DIR, `backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(products, null, 2));
  console.log(`Backup saved → ${file}`);
}

function logUpdate(entry: Record<string, unknown>) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

// Read a metafield by trying several likely keys (store setups vary)
function metafield(p: ShopifyProduct, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = p.metafields[k.toLowerCase()];
    if (v?.trim()) return v.trim();
  }
  return undefined;
}

function toProductInput(p: ShopifyProduct): ProductInput {
  return {
    title: p.title,
    material: metafield(p, "material", "metall") ?? p.productType ?? undefined,
    gemstone: metafield(p, "gemstone", "edelstein", "stein", "stone"),
    weight: p.weight ? `${p.weight.value} ${p.weight.unit}` : undefined,
    dimensions: metafield(p, "dimensions", "maße", "masse", "groesse", "größe"),
    collection: p.collections[0] ?? (p.vendor || undefined),
    tags: p.tags.length ? p.tags : undefined,
    careInstructions: metafield(p, "care", "pflege", "pflegehinweise"),
  };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processBatch(
  client: Anthropic,
  products: ShopifyProduct[],
  domain: string,
  token: string,
  model?: string
) {
  for (const product of products) {
    console.log(`\n→ ${product.title} (${product.numericId})`);
    try {
      const input = toProductInput(product);
      const description = await generateDescription(client, input, model);
      console.log(`  Generated: ${description.slice(0, 80)}…`);

      const seo = WITH_SEO ? await generateSeo(client, input, model) : undefined;
      if (seo) console.log(`  SEO: ${seo.title}`);

      const jsonLd = WITH_JSONLD
        ? buildProductJsonLd({
            title: product.title,
            descriptionPlain: htmlToPlainText(description),
            url: product.onlineStoreUrl,
            imageUrl: product.imageUrl,
            brand: product.vendor || undefined,
            sku: product.sku,
            material: input.material,
            price: product.price,
            currency: product.currency,
            available: product.available,
          })
        : undefined;
      if (jsonLd) console.log(`  JSON-LD: schema.org/Product built`);

      if (!DRY_RUN) {
        await updateProductDescription(domain, token, product.id, description, seo);
        if (jsonLd) await setProductJsonLd(domain, token, product.id, jsonLd);
        const extras = [seo && "SEO", jsonLd && "JSON-LD"].filter(Boolean).join(", ");
        console.log(`  Updated on Shopify${extras ? ` (incl. ${extras})` : ""}`);
      } else {
        console.log(`  [DRY RUN] Skipping Shopify update`);
      }

      logUpdate({
        timestamp: new Date().toISOString(),
        productId: product.numericId,
        title: product.title,
        dryRun: DRY_RUN,
        description,
        seo,
        jsonLd,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${message}`);
      logUpdate({
        timestamp: new Date().toISOString(),
        productId: product.numericId,
        title: product.title,
        error: message,
      });
    }
    // Respect Shopify rate limits and Anthropic API limits
    await sleep(500);
  }
}

async function main() {
  const domain = requireEnv("SHOPIFY_SHOP_DOMAIN");
  const token = requireEnv("SHOPIFY_ACCESS_TOKEN");
  requireEnv("ANTHROPIC_API_KEY");

  ensureDirs();

  console.log(`\nJewelkunst AI Description Generator`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Model: ${MODEL ?? "claude-sonnet-4-6 (default)"}`);
  console.log(`Fetching products from ${domain}…`);

  const allProducts = await fetchAllProducts(domain, token);
  console.log(`Found ${allProducts.length} products`);

  saveBackup(allProducts);

  let targets = allProducts;
  if (SKIP_EXISTING) {
    targets = targets.filter((p) => !p.descriptionHtml?.trim());
    console.log(`Skipping existing → ${targets.length} products to process`);
  }
  if (isFinite(LIMIT)) {
    targets = targets.slice(0, LIMIT);
    console.log(`Limiting to ${LIMIT} products`);
  }

  const client = new Anthropic();

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(targets.length / BATCH_SIZE)}`);
    await processBatch(client, batch, domain, token, MODEL);
  }

  console.log(`\nDone. Log → ${LOG_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
