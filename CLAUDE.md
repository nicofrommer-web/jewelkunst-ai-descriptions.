# CLAUDE.md — Jewelkunst AI Descriptions

## Project Overview

This repository powers AI-generated product descriptions for **Jewelkunst** (`jewelkunst.net`), a jewelry store running on Shopify. The goal is to generate high-quality, brand-consistent product descriptions using Claude and publish them directly to the Shopify store via the Shopify Admin API.

## Repository Status

This repository is in its **initial state** — no source files exist yet. When development begins, this file should be updated to reflect the actual structure.

---

## Intended Architecture

| Layer | Purpose |
|---|---|
| AI generation | Claude API (claude-haiku-4-5-20251001 for speed, claude-sonnet-4-6 for quality) |
| Store integration | Shopify Admin API via Shopify MCP tools or direct REST/GraphQL calls |
| Orchestration | Scripts or a lightweight Node.js / Python CLI |
| Configuration | Environment variables (`.env`, never committed) |

---

## Development Conventions

### Git Workflow

- **Feature branches**: `feature/<short-description>` (e.g., `feature/bulk-description-generator`)
- **Fix branches**: `fix/<short-description>`
- **Claude-managed branches**: `claude/<task-slug>` (automatically assigned by the Claude Code harness)
- Commit messages use the imperative mood: _"Add batch generation script"_, not _"Added..."_
- Never commit `.env` files, secrets, or API keys
- Push to the designated feature branch; open a PR for review before merging to `main`

### Code Style

- **Language**: TypeScript (preferred) or Python 3.12+
- **Formatting**: Prettier (TS/JS) or Black (Python) — run before committing
- **Linting**: ESLint (TS/JS) or Ruff (Python)
- No inline comments unless the WHY is non-obvious
- No multi-line docstrings; one-line function comments only where needed

### Environment Variables

Store all secrets in `.env` (never committed). Expected variables:

```
ANTHROPIC_API_KEY=        # Claude API key
SHOPIFY_SHOP_DOMAIN=      # e.g., jewelkunst.myshopify.com
SHOPIFY_ACCESS_TOKEN=     # Shopify Admin API token
```

---

## AI Description Guidelines

When generating product descriptions for Jewelkunst:

- **Tone**: Elegant, warm, artisanal — reflects handcrafted jewelry
- **Length**: 80–150 words per description (Shopify body_html)
- **Format**: Short introductory sentence, 1–2 feature highlights, closing call-to-action
- **Language**: Match the store's primary language (confirm before bulk runs)
- **Avoid**: Generic filler phrases, overly technical jargon, duplicate phrasing across similar products

### Prompt Design

- Always include: product title, material, weight/dimensions if available
- Optionally include: collection name, target audience, care instructions
- System prompt should establish brand voice once; product details go in the user message
- Prefer `claude-haiku-4-5-20251001` for bulk runs (cost-efficient), `claude-sonnet-4-6` for hero products

---

## Shopify Integration

The Shopify MCP server is available in Claude Code sessions and provides tools for:

- Searching and reading products: `search_products`, `get-product`
- Updating product descriptions: `update-product` or `graphql_mutation`
- Managing collections: `get-collection`, `search_collections`
- Running analytics: `run-analytics-query`

For bulk operations or resources not covered by built-in tools, use `graphql_query` / `graphql_mutation` directly against the Shopify Admin GraphQL API.

### Key GraphQL Operations

Update a product description:
```graphql
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id title descriptionHtml }
    userErrors { field message }
  }
}
```

Variables: `{ "input": { "id": "gid://shopify/Product/<id>", "descriptionHtml": "<p>...</p>" } }`

---

## Testing & Validation

- Before bulk-updating descriptions, test on **1–3 products** and review output manually
- Confirm HTML renders correctly in Shopify's storefront preview
- Log which products were updated (product ID + timestamp) to avoid duplicates
- Keep a backup of original descriptions before overwriting (fetch and save first)

---

## File Structure (Planned)

```
jewelkunst-ai-descriptions/
├── CLAUDE.md                  # This file
├── .env.example               # Template for environment variables
├── .gitignore
├── src/
│   ├── generate.ts            # Core description generation logic
│   ├── shopify.ts             # Shopify API client helpers
│   └── batch.ts               # Bulk processing orchestration
├── prompts/
│   └── system.txt             # Brand voice system prompt
├── output/                    # Generated descriptions (gitignored or tracked)
└── scripts/
    └── run-batch.sh           # Entry point for batch jobs
```

---

## Claude Code Usage Notes

- The Shopify MCP server and GitHub MCP server are pre-configured in this environment
- Use `mcp__Shopify__*` tools for store interactions
- Use `mcp__github__*` tools for all GitHub operations (no `gh` CLI available)
- Always develop on the designated branch; never push directly to `main`
- Sensitive data (API keys, customer info) must never appear in code, commits, or PR descriptions
