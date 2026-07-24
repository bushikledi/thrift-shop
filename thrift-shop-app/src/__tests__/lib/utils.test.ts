import { formatPrice, formatCurrency, slugify, truncate } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats a numeric price in ALL by default", () => {
    // Intl output can use a non-breaking space; assert on the meaningful parts.
    const out = formatPrice(297);
    expect(out).toContain("ALL");
    expect(out).toContain("297");
  });

  it("coerces a string price (API returns Prisma Decimal as a string)", () => {
    // Regression for F4: calling .toFixed() on the string crashed the page.
    const out = formatPrice("246");
    expect(out).toContain("246");
    expect(() => formatPrice("246")).not.toThrow();
  });

  it("treats null/undefined as 0 instead of throwing", () => {
    expect(() => formatPrice(null)).not.toThrow();
    expect(() => formatPrice(undefined)).not.toThrow();
    expect(formatPrice(null)).toContain("0");
  });

  it("falls back to 0 for non-numeric strings", () => {
    expect(formatPrice("not-a-number")).toContain("0");
  });

  it("formatCurrency is an alias of formatPrice", () => {
    expect(formatCurrency(50)).toBe(formatPrice(50));
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Women's Clothing")).toBe("women-s-clothing");
  });
  it("trims leading/trailing separators", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });
});

describe("truncate", () => {
  it("leaves short text unchanged", () => {
    expect(truncate("short", 10)).toBe("short");
  });
  it("adds an ellipsis when over length", () => {
    expect(truncate("a very long title", 6)).toBe("a very...");
  });
});
