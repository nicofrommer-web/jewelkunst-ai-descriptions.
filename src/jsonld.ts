// Builds schema.org/Product JSON-LD for rich snippets (price, availability,
// brand) in Google search results. Pure and deterministic — no API calls.

export interface JsonLdInput {
  title: string;
  descriptionPlain?: string;
  url?: string;
  imageUrl?: string;
  brand?: string;
  sku?: string;
  material?: string;
  price?: string;     // decimal string, e.g. "34.99"
  currency?: string;  // ISO 4217, e.g. "EUR"
  available?: boolean;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildProductJsonLd(input: JsonLdInput): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: input.title,
  };

  if (input.descriptionPlain) obj.description = input.descriptionPlain;
  if (input.imageUrl) obj.image = input.imageUrl;
  if (input.brand) obj.brand = { "@type": "Brand", name: input.brand };
  if (input.sku) obj.sku = input.sku;
  if (input.material) obj.material = input.material;

  if (input.price && input.currency) {
    obj.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      availability: input.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(input.url ? { url: input.url } : {}),
    };
  }

  return obj;
}

// Renders a ready-to-embed <script> tag. Escapes "</" so the JSON can never
// terminate the surrounding <script> element.
export function renderJsonLdScript(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj, null, 2).replace(/<\//g, "<\\/");
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
