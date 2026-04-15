import { describe, it, expect } from "vitest";
import { safeJsonLd } from "@/lib/jsonld";

describe("safeJsonLd", () => {
  it("escapes < to \\u003c to prevent breaking out of a <script> tag", () => {
    const out = safeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    // No literal `</script>`, `<script`, or `<img` substring remains.
    expect(out).not.toMatch(/<\/script>/i);
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<img/i);
    expect(out).toContain("\\u003c/script");
    expect(out).toContain("\\u003cimg");
  });

  it("escapes opening script tags inside string values", () => {
    const out = safeJsonLd({ description: "<script>alert(1)</script>" });
    // Security property: no literal `<script` or `</script>` substring
    // remains, so the HTML parser cannot exit the surrounding script tag
    // or start a nested one.
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<\/script/i);
    expect(out).toContain("\\u003cscript");
    expect(out).toContain("\\u003c/script");
  });

  it("escapes HTML comment openers that could smuggle scripts", () => {
    const out = safeJsonLd({ bio: "<!-- danger -->" });
    // `<!--` is the dangerous sequence (it opens an HTML comment and
    // changes the script's parsing state). Escaping `<` neutralizes it.
    expect(out).not.toContain("<!--");
    expect(out).toContain("\\u003c!--");
  });

  it("preserves JSON structure — still parseable back to the original", () => {
    const original = {
      "@context": "https://schema.org",
      name: "Acme </script> Corp",
      reviews: [{ author: "<script>alert(1)</script>", text: "great" }],
    };
    const serialized = safeJsonLd(original);
    expect(JSON.parse(serialized)).toEqual(original);
  });

  it("handles nested arrays and objects", () => {
    const input = {
      items: [{ tag: "<a>" }, { tag: "<b>" }, { nested: [{ deep: "<c>" }] }],
    };
    const out = safeJsonLd(input);
    // No literal `<` remains — only `\u003c` escapes.
    expect(out).not.toContain("<");
    // Round-trips to the original structure.
    expect(JSON.parse(out)).toEqual(input);
  });

  it("leaves non-angle-bracket characters alone", () => {
    const out = safeJsonLd({ name: "Smith & Sons", tagline: "A+B=C" });
    expect(out).toContain("Smith & Sons");
    expect(out).toContain("A+B=C");
  });

  it("works for primitives, arrays, null", () => {
    expect(safeJsonLd(null)).toBe("null");
    expect(safeJsonLd(42)).toBe("42");
    expect(safeJsonLd("hello")).toBe('"hello"');
    expect(safeJsonLd([1, 2, 3])).toBe("[1,2,3]");
  });
});
