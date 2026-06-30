/**
 * Restore product descriptions (and SEO meta) from a backup snapshot.
 *
 * Every `npm run batch` writes a snapshot to output/backups/ before changing
 * anything. This script writes that snapshot back to Shopify — the safety net
 * if a live run produced bad output.
 *
 * Usage:
 *   npm run restore -- [--file PATH] [--dry-run] [--limit N]
 *
 * Run `npm run restore -- --help` for the full option list.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { updateProductDescription, type ShopifyProduct } from "./shopify.js";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function flagValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const HELP = `Jewelkunst Description Restore

Usage:
  npm run restore -- [options]

Options:
  --file PATH    Backup JSON to restore from. Default: newest in output/backups.
  --dry-run      Show what would be restored without writing to Shopify.
  --limit N      Restore at most N products.
  -h, --help     Show this help and exit.

Environment (.env):
  SHOPIFY_SHOP_DOMAIN, SHOPIFY_ACCESS_TOKEN
`;

if (hasFlag("--help") || hasFlag("-h")) {
  console.log(HELP);
  process.exit(0);
}

const DRY_RUN = hasFlag("--dry-run") || process.env.DRY_RUN === "true";
const LIMIT = (() => {
  const v = flagValue("--limit");
  return v !== undefined ? parseInt(v, 10) : Infinity;
})();
const BACKUP_DIR = path.join("output", "backups");
const LOG_FILE = path.join("output", "restore-log.jsonl");

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function newestBackup(): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`No backup directory at ${BACKUP_DIR}. Run a batch first.`);
  }
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(BACKUP_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) throw new Error(`No backup files in ${BACKUP_DIR}.`);
  return files[0];
}

function loadBackup(file: string): ShopifyProduct[] {
  const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`Backup ${file} is not an array of products.`);
  }
  return parsed as ShopifyProduct[];
}

function logRestore(entry: Record<string, unknown>) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const domain = requireEnv("SHOPIFY_SHOP_DOMAIN");
  const token = requireEnv("SHOPIFY_ACCESS_TOKEN");

  const file = flagValue("--file") ?? newestBackup();
  const products = loadBackup(file);
  const targets = isFinite(LIMIT) ? products.slice(0, LIMIT) : products;

  console.log(`\nJewelkunst Description Restore`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Source: ${file}`);
  console.log(`Restoring ${targets.length} of ${products.length} products → ${domain}`);

  let ok = 0;
  let failed = 0;

  for (const product of targets) {
    if (!product.id) {
      console.error(`  Skipping entry without id: ${product.title ?? "?"}`);
      continue;
    }
    console.log(`\n→ ${product.title} (${product.numericId ?? "?"})`);
    try {
      if (!DRY_RUN) {
        await updateProductDescription(
          domain,
          token,
          product.id,
          product.descriptionHtml ?? "",
          product.seo
        );
        console.log(`  Restored${product.seo ? " (incl. SEO)" : ""}`);
      } else {
        console.log(`  [DRY RUN] Would restore${product.seo ? " (incl. SEO)" : ""}`);
      }
      ok++;
      logRestore({
        timestamp: new Date().toISOString(),
        productId: product.numericId,
        title: product.title,
        dryRun: DRY_RUN,
        source: file,
      });
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${message}`);
      logRestore({
        timestamp: new Date().toISOString(),
        productId: product.numericId,
        title: product.title,
        error: message,
      });
    }
    await sleep(500);
  }

  console.log(`\nDone. Restored ${ok}, failed ${failed}. Log → ${LOG_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
