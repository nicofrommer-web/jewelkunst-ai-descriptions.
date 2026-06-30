const API_VERSION = "2024-10";

export interface ShopifyProduct {
  id: string;         // GID: gid://shopify/Product/123
  numericId: string;  // Just the number part
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  collections: string[];
  weight?: { value: number; unit: string };
  metafields: Record<string, string>; // keyed by metafield key, lowercased
  imageUrl?: string;
  onlineStoreUrl?: string;
  price?: string;     // decimal string, e.g. "34.99"
  currency?: string;  // ISO 4217, e.g. "EUR"
  sku?: string;
  available?: boolean;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function shopifyHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };
}

function shopifyUrl(domain: string): string {
  return `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
}

async function graphql<T>(
  domain: string,
  token: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(shopifyUrl(domain), {
    method: "POST",
    headers: shopifyHeaders(token),
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify HTTP error ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("Shopify returned no data");
  }
  return json.data;
}

const LIST_PRODUCTS_QUERY = `
  query listProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        descriptionHtml
        vendor
        productType
        tags
        onlineStoreUrl
        featuredImage { url }
        priceRangeV2 { minVariantPrice { amount currencyCode } }
        collections(first: 5) { nodes { title } }
        variants(first: 1) { nodes { weight weightUnit sku availableForSale } }
        metafields(first: 20) { nodes { key value } }
      }
    }
  }
`;

interface ProductNode {
  id: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  onlineStoreUrl: string | null;
  featuredImage: { url: string } | null;
  priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } } | null;
  collections: { nodes: Array<{ title: string }> };
  variants: {
    nodes: Array<{
      weight: number | null;
      weightUnit: string;
      sku: string | null;
      availableForSale: boolean;
    }>;
  };
  metafields: { nodes: Array<{ key: string; value: string } | null> };
}

interface ProductsPage {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string };
    nodes: ProductNode[];
  };
}

function mapProduct(node: ProductNode): ShopifyProduct {
  const variant = node.variants.nodes[0];
  const metafields: Record<string, string> = {};
  for (const mf of node.metafields.nodes) {
    if (mf?.key && mf.value) metafields[mf.key.toLowerCase()] = mf.value;
  }

  return {
    id: node.id,
    numericId: node.id.split("/").pop()!,
    title: node.title,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags,
    collections: node.collections.nodes.map((c) => c.title),
    weight:
      variant?.weight != null && variant.weight > 0
        ? { value: variant.weight, unit: variant.weightUnit }
        : undefined,
    metafields,
    imageUrl: node.featuredImage?.url ?? undefined,
    onlineStoreUrl: node.onlineStoreUrl ?? undefined,
    price: node.priceRangeV2?.minVariantPrice.amount ?? undefined,
    currency: node.priceRangeV2?.minVariantPrice.currencyCode ?? undefined,
    sku: variant?.sku ?? undefined,
    available: variant?.availableForSale ?? undefined,
  };
}

export async function fetchAllProducts(
  domain: string,
  token: string,
  pageSize = 50
): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const data: ProductsPage = await graphql<ProductsPage>(
      domain,
      token,
      LIST_PRODUCTS_QUERY,
      { first: pageSize, after: cursor }
    );

    for (const node of data.products.nodes) {
      products.push(mapProduct(node));
    }

    hasMore = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return products;
}

const UPDATE_DESCRIPTION_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id title }
      userErrors { field message }
    }
  }
`;

export interface ProductSeo {
  title: string;
  description: string;
}

export async function updateProductDescription(
  domain: string,
  token: string,
  productId: string,
  descriptionHtml: string,
  seo?: ProductSeo
): Promise<void> {
  const input: Record<string, unknown> = { id: productId, descriptionHtml };
  if (seo) input.seo = { title: seo.title, description: seo.description };

  const data = await graphql<{
    productUpdate: {
      product: { id: string; title: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(domain, token, UPDATE_DESCRIPTION_MUTATION, { input });

  if (data.productUpdate.userErrors.length) {
    const errs = data.productUpdate.userErrors
      .map((e) => `${e.field.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Shopify userErrors for ${productId}: ${errs}`);
  }
}

const SET_METAFIELD_MUTATION = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message }
    }
  }
`;

// Stores the JSON-LD object in a product metafield (namespace "seo", key
// "json_ld", type "json"). The theme renders it with a one-line snippet —
// see the PR description. Keeps structured data out of body_html.
export async function setProductJsonLd(
  domain: string,
  token: string,
  productId: string,
  jsonLd: Record<string, unknown>
): Promise<void> {
  const data = await graphql<{
    metafieldsSet: {
      metafields: Array<{ id: string }> | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(domain, token, SET_METAFIELD_MUTATION, {
    metafields: [
      {
        ownerId: productId,
        namespace: "seo",
        key: "json_ld",
        type: "json",
        value: JSON.stringify(jsonLd),
      },
    ],
  });

  if (data.metafieldsSet.userErrors.length) {
    const errs = data.metafieldsSet.userErrors
      .map((e) => `${e.field.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Shopify metafield userErrors for ${productId}: ${errs}`);
  }
}
