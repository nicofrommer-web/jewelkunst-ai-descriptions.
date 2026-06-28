const API_VERSION = "2024-10";

export interface ShopifyProduct {
  id: string;         // GID: gid://shopify/Product/123
  numericId: string;  // Just the number part
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
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
      }
    }
  }
`;

export async function fetchAllProducts(
  domain: string,
  token: string,
  pageSize = 50
): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const data = await graphql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string };
        nodes: Array<{ id: string; title: string; descriptionHtml: string; vendor: string; productType: string }>;
      };
    }>(domain, token, LIST_PRODUCTS_QUERY, { first: pageSize, after: cursor });

    for (const node of data.products.nodes) {
      products.push({
        id: node.id,
        numericId: node.id.split("/").pop()!,
        title: node.title,
        descriptionHtml: node.descriptionHtml,
        vendor: node.vendor,
        productType: node.productType,
      });
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

export async function updateProductDescription(
  domain: string,
  token: string,
  productId: string,
  descriptionHtml: string
): Promise<void> {
  const data = await graphql<{
    productUpdate: {
      product: { id: string; title: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(domain, token, UPDATE_DESCRIPTION_MUTATION, {
    input: { id: productId, descriptionHtml },
  });

  if (data.productUpdate.userErrors.length) {
    const errs = data.productUpdate.userErrors
      .map((e) => `${e.field.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Shopify userErrors for ${productId}: ${errs}`);
  }
}
