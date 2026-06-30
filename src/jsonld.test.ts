import { describe, it, expect } from "vitest";
import { htmlToPlainText, buildProductJsonLd, renderJsonLdScript } from "./jsonld.js";

describe("htmlToPlainText", () => {
  it("strips HTML tags", () => {
    expect(htmlToPlainText("<p>Eine <strong>feine</strong> Kette.</p>")).toBe(
      "Eine feine Kette."
    );
  });

  it("decodes &nbsp; and &amp;", () => {
    expect(htmlToPlainText("Gold&nbsp;&amp;&nbsp;Silber")).toBe("Gold & Silber");
  });

  it("collapses whitespace and trims", () => {
    expect(htmlToPlainText("  a\n\n   b\t c  ")).toBe("a b c");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
  });
});

describe("buildProductJsonLd", () => {
  it("builds the minimal valid shape from a title only", () => {
    const obj = buildProductJsonLd({ title: "Eclipse Chain" });
    expect(obj).toEqual({
      "@context": "https://schema.org/",
      "@type": "Product",
      name: "Eclipse Chain",
    });
  });

  it("includes optional fields when provided", () => {
    const obj = buildProductJsonLd({
      title: "Aurum Signet",
      descriptionPlain: "Ein Siegelring.",
      imageUrl: "https://cdn/x.jpg",
      brand: "Jewelkunst",
      sku: "AUR-1",
      material: "Edelstahl",
    });
    expect(obj.description).toBe("Ein Siegelring.");
    expect(obj.image).toBe("https://cdn/x.jpg");
    expect(obj.brand).toEqual({ "@type": "Brand", name: "Jewelkunst" });
    expect(obj.sku).toBe("AUR-1");
    expect(obj.material).toBe("Edelstahl");
  });

  it("adds an InStock Offer when price and currency are present", () => {
    const obj = buildProductJsonLd({
      title: "Venom Bracelet",
      price: "34.99",
      currency: "EUR",
      available: true,
      url: "https://jewelkunst.net/p/venom",
    });
    expect(obj.offers).toEqual({
      "@type": "Offer",
      price: "34.99",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: "https://jewelkunst.net/p/venom",
    });
  });

  it("marks the Offer OutOfStock when not available", () => {
    const obj = buildProductJsonLd({
      title: "x",
      price: "10.00",
      currency: "EUR",
      available: false,
    });
    expect((obj.offers as Record<string, unknown>).availability).toBe(
      "https://schema.org/OutOfStock"
    );
  });

  it("omits the Offer when currency is missing", () => {
    const obj = buildProductJsonLd({ title: "x", price: "10.00" });
    expect(obj.offers).toBeUndefined();
  });

  it("omits the Offer url when no url is given", () => {
    const obj = buildProductJsonLd({ title: "x", price: "5", currency: "EUR" });
    expect(obj.offers).not.toHaveProperty("url");
  });
});

describe("renderJsonLdScript", () => {
  it("wraps the JSON in an ld+json script tag", () => {
    const script = renderJsonLdScript(buildProductJsonLd({ title: "x" }));
    expect(script.startsWith('<script type="application/ld+json">')).toBe(true);
    expect(script.trimEnd().endsWith("</script>")).toBe(true);
  });

  it("escapes '</' so a description cannot break out of the tag", () => {
    const obj = buildProductJsonLd({
      title: "x",
      descriptionPlain: "evil </script><script>alert(1)",
    });
    const script = renderJsonLdScript(obj);
    // The only literal "</" allowed is the closing </script> tag itself.
    expect(script.match(/<\//g)?.length).toBe(1);
    expect(script).toContain("<\\/script>");
  });

  it("produces parseable JSON inside the tag", () => {
    const obj = buildProductJsonLd({
      title: "Eclipse Chain",
      price: "34.99",
      currency: "EUR",
      available: true,
    });
    const script = renderJsonLdScript(obj);
    const json = script
      .replace('<script type="application/ld+json">', "")
      .replace("</script>", "")
      .replace(/<\\\//g, "</");
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("Product");
    expect(parsed.offers.priceCurrency).toBe("EUR");
  });
});
