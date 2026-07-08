# Jewelkunst AI Descriptions

AI-generated, brand-consistent product descriptions for **Jewelkunst**
(`jewelkunst.net`), a Shopify jewelry store. The generator reads products
from the Shopify Admin API, writes German descriptions with Claude, and can
also produce SEO meta fields and `schema.org/Product` structured data — then
publishes everything back to the store.

> Looking for AI-assistant/contributor conventions? See **[CLAUDE.md](./CLAUDE.md)**.
> This README is the practical guide for running the tool.

---

## What it does

For every product in the store, the batch run can:

1. **Generate a description** — elegant, warm, artisanal German copy
   (80–150 words, HTML), grounded in the product's real data (material,
   gemstone, weight, collection, tags, care).
2. **Generate SEO meta** (`--seo`) — meta title (≤60), meta description
   (≤155) and image alt text (≤125), written to Shopify's `seo` fields.
3. **Generate JSON-LD** (`--json-ld`) — `schema.org/Product` structured data
   for Google rich snippets, stored in the `seo.json_ld` product metafield.

Every run backs up existing products first and logs every result.

---

## Requirements

- **Node.js 18+** (uses the global `fetch`)
- An **Anthropic API key**
- A **Shopify Admin API access token** with `read_products` / `write_products`

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# then edit .env (see below)
```

### Environment variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `SHOPIFY_SHOP_DOMAIN` | ✅ | e.g. `jewelkunst.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | ✅ | Shopify Admin API token |
| `CLAUDE_MODEL` | — | Override the default model (`claude-sonnet-4-6`) |
| `BATCH_SIZE` | — | Products per batch (default `5`) |
| `DRY_RUN` | — | `true` to never write to Shopify |

`.env` is git-ignored — never commit secrets.

---

## Usage

```bash
# Safe first test — generate for 3 products, write nothing
npm run batch -- --limit 3 --dry-run

# Full pipeline (description + SEO + structured data), still a dry run
npm run batch -- --limit 3 --dry-run --seo --json-ld

# Live run — updates Shopify
npm run batch -- --seo --json-ld

# Show all options
npm run batch -- --help
```

### Options

| Flag | Effect |
|---|---|
| `--dry-run` | Generate but do **not** write to Shopify (same as `DRY_RUN=true`) |
| `--limit N` | Process at most `N` products (good for testing) |
| `--skip-existing` | Skip products that already have a description |
| `--seo` | Also generate + write SEO meta title/description (and image alt) |
| `--json-ld` | Build `schema.org/Product` JSON-LD and store it in `seo.json_ld` |
| `--model NAME` | Choose the Claude model (overrides `CLAUDE_MODEL`) |
| `-h`, `--help` | Print help and exit |

**Model tip:** use the default `claude-sonnet-4-6` for hero products and
`--model claude-haiku-4-5-20251001` for cheap bulk runs.

### npm scripts

| Script | Purpose |
|---|---|
| `npm run batch` | Run the generator (pass flags after `--`) |
| `npm run restore` | Restore descriptions/SEO from a backup (pass flags after `--`) |
| `npm test` | Run the unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src` |

---

## Output

Created at runtime (git-ignored):

```
output/
├── backups/             # JSON snapshot of every product, taken before any update
└── update-log.jsonl     # one line per product: description, seo, jsonLd, or error
```

The backup is your safety net — every run snapshots all products before
writing anything.

### Restoring from a backup

If a live run produced bad output, roll back with the restore script. It
writes the descriptions (and SEO meta) from a backup snapshot back to Shopify.

```bash
# Preview a restore from the newest backup (writes nothing)
npm run restore -- --dry-run

# Restore from the newest backup
npm run restore

# Restore from a specific file, limited to 3 products
npm run restore -- --file output/backups/backup-1717000000000.json --limit 3
```

| Flag | Effect |
|---|---|
| `--file PATH` | Backup to restore from (default: newest in `output/backups`) |
| `--dry-run` | Show what would be restored without writing |
| `--limit N` | Restore at most `N` products |
| `-h`, `--help` | Print help and exit |

Restores are logged to `output/restore-log.jsonl`.

---

## Rich snippets: one-time theme step

`--json-ld` stores the structured data in the product metafield
`seo.json_ld`. To make Google see it, render that metafield once in your
theme (`theme.liquid` or `product.liquid`):

```liquid
{% if product.metafields.seo.json_ld %}
  <script type="application/ld+json">{{ product.metafields.seo.json_ld.value | json }}</script>
{% endif %}
```

After that, every product processed with `--json-ld` is automatically
exposed to search engines.

---

## Recommended workflow

1. **Dry-run on a few products** and review the output:
   `npm run batch -- --limit 3 --dry-run --seo --json-ld`
2. **Tune the voice** in [`prompts/system.txt`](./prompts/system.txt) if needed.
3. **Check the backup** in `output/backups/` exists.
4. **Go live** in small batches first (`--limit`), then the full catalog.
5. **Add the theme snippet** (above) so JSON-LD is rendered.

---

## Project structure

```
jewelkunst-ai-descriptions/
├── README.md                  # This file
├── CLAUDE.md                  # Conventions for AI assistants
├── .env.example               # Copy to .env
├── package.json
├── tsconfig.json
├── src/
│   ├── generate.ts            # generateDescription() + generateSeo()
│   ├── jsonld.ts              # buildProductJsonLd() — schema.org/Product
│   ├── shopify.ts             # fetch products + write description/seo/metafields
│   ├── batch.ts               # CLI entry point — generate & publish
│   └── restore.ts             # CLI entry point — roll back from a backup
├── prompts/
│   └── system.txt             # German brand-voice system prompt
└── output/                    # backups + update log (runtime, git-ignored)
```

---

## Safety notes

- Always **dry-run first** and review on 1–3 products.
- Live runs **overwrite** existing descriptions — the pre-run backup in
  `output/backups/` lets you restore.
- Confirm the connected store is actually Jewelkunst before any live run
  (`SHOPIFY_SHOP_DOMAIN`).
- Never commit `.env`, tokens, or customer data.
