import { describe, it, expect } from "vitest";
import { detectImageMime, verifyImageUpload } from "../image-signature";

// Minimal valid leading bytes for each format
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF87 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
const GIF89 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // file size placeholder
  0x57, 0x45, 0x42, 0x50, // WEBP
]);
const HTML = new TextEncoder().encode("<!DOCTYPE html><html><body>");
const SVG = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>");
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

describe("detectImageMime", () => {
  it("detects JPEG", () => {
    expect(detectImageMime(JPEG)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    expect(detectImageMime(PNG)).toBe("image/png");
  });

  it("detects GIF87a", () => {
    expect(detectImageMime(GIF87)).toBe("image/gif");
  });

  it("detects GIF89a", () => {
    expect(detectImageMime(GIF89)).toBe("image/gif");
  });

  it("detects WebP", () => {
    expect(detectImageMime(WEBP)).toBe("image/webp");
  });

  it("returns null for HTML", () => {
    expect(detectImageMime(HTML)).toBeNull();
  });

  it("returns null for SVG (deliberately unsupported, script vector)", () => {
    expect(detectImageMime(SVG)).toBeNull();
  });

  it("returns null for ZIP file", () => {
    expect(detectImageMime(ZIP)).toBeNull();
  });

  it("returns null for empty buffer", () => {
    expect(detectImageMime(new Uint8Array(0))).toBeNull();
  });

  it("returns null for buffers too short to classify", () => {
    expect(detectImageMime(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("verifyImageUpload", () => {
  it("accepts a JPEG declared as image/jpeg", () => {
    const res = verifyImageUpload(JPEG, "image/jpeg");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.mime).toBe("image/jpeg");
  });

  it("accepts a PNG declared as image/png", () => {
    const res = verifyImageUpload(PNG, "image/png");
    expect(res.ok).toBe(true);
  });

  it("rejects JPEG bytes declared as image/png (MIME mismatch)", () => {
    const res = verifyImageUpload(JPEG, "image/png");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/Declared type image\/png but bytes are image\/jpeg/);
  });

  it("rejects HTML bytes with image/jpeg declared (the main attack)", () => {
    const res = verifyImageUpload(HTML, "image/jpeg");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/not a recognized image format/);
  });

  it("rejects SVG even when declared as image/svg+xml (SVG is not allowed)", () => {
    const res = verifyImageUpload(SVG, "image/svg+xml");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/Unsupported content type/);
  });

  it("rejects disallowed content types up-front", () => {
    const res = verifyImageUpload(JPEG, "application/octet-stream");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/Unsupported content type/);
  });

  it("rejects empty upload", () => {
    const res = verifyImageUpload(new Uint8Array(0), "image/jpeg");
    expect(res.ok).toBe(false);
  });
});
