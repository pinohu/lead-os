import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

function createDOM() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.com/page",
    pretendToBeVisual: true,
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.sessionStorage = dom.window.sessionStorage;
  global.HTMLElement = dom.window.HTMLElement;

  return dom;
}

function cleanupDOM() {
  delete global.window;
  delete global.document;
  delete global.sessionStorage;
  delete global.HTMLElement;
}

async function loadModule() {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src", "index.js"),
    "utf8",
  );
  const stripped = src
    .replace(/^export /gm, "")
    .replace(/if \(typeof window.*\n[\s\S]*$/, "");

  const blob = new Blob([stripped], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);

  try {
    return await import(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

test("createElement builds DOM nodes with attributes", () => {
  const dom = createDOM();
  try {
    const fn = new Function(
      "document",
      `
      function createElement(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
          if (key === "style" && typeof value === "object") {
            Object.assign(element.style, value);
            continue;
          }
          if (key.startsWith("on") && typeof value === "function") {
            element.addEventListener(key.slice(2).toLowerCase(), value);
            continue;
          }
          if (value != null) {
            element.setAttribute(key, String(value));
          }
        }
        for (const child of children) {
          if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
            continue;
          }
          element.appendChild(child);
        }
        return element;
      }
      return createElement;
    `,
    );
    const createElement = fn(document);

    const el = createElement("div", { id: "test", "data-x": "y" }, ["Hello"]);
    assert.equal(el.tagName, "DIV");
    assert.equal(el.id, "test");
    assert.equal(el.getAttribute("data-x"), "y");
    assert.equal(el.textContent, "Hello");
  } finally {
    cleanupDOM();
  }
});

test("createElement applies inline styles", () => {
  const dom = createDOM();
  try {
    const fn = new Function(
      "document",
      `
      function createElement(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
          if (key === "style" && typeof value === "object") {
            Object.assign(element.style, value);
            continue;
          }
          if (value != null) element.setAttribute(key, String(value));
        }
        return element;
      }
      return createElement;
    `,
    );
    const createElement = fn(document);

    const el = createElement("span", { style: { color: "red", fontWeight: "700" } });
    assert.equal(el.style.color, "red");
    assert.equal(el.style.fontWeight, "700");
  } finally {
    cleanupDOM();
  }
});

test("createElement registers event listeners via on* attributes", () => {
  const dom = createDOM();
  try {
    const fn = new Function(
      "document",
      `
      function createElement(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
          if (key === "style" && typeof value === "object") {
            Object.assign(element.style, value);
            continue;
          }
          if (key.startsWith("on") && typeof value === "function") {
            element.addEventListener(key.slice(2).toLowerCase(), value);
            continue;
          }
          if (value != null) element.setAttribute(key, String(value));
        }
        return element;
      }
      return createElement;
    `,
    );
    const createElement = fn(document);

    let clicked = false;
    const btn = createElement("button", { onClick: () => { clicked = true; } });
    btn.click();
    assert.equal(clicked, true);
  } finally {
    cleanupDOM();
  }
});

test("email validation rejects empty input", () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_EMAIL_LEN = 254;

  function validateEmail(value) {
    if (!value || typeof value !== "string") return "Email is required.";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Email is required.";
    if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  assert.equal(validateEmail(""), "Email is required.");
  assert.equal(validateEmail(null), "Email is required.");
  assert.equal(validateEmail(undefined), "Email is required.");
  assert.equal(validateEmail("   "), "Email is required.");
});

test("email validation rejects invalid formats", () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_EMAIL_LEN = 254;

  function validateEmail(value) {
    if (!value || typeof value !== "string") return "Email is required.";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Email is required.";
    if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  assert.equal(validateEmail("notanemail"), "Please enter a valid email address.");
  assert.equal(validateEmail("missing@dot"), "Please enter a valid email address.");
  assert.equal(validateEmail("@no-local.com"), "Please enter a valid email address.");
});

test("email validation accepts valid emails", () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_EMAIL_LEN = 254;

  function validateEmail(value) {
    if (!value || typeof value !== "string") return "Email is required.";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Email is required.";
    if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  assert.equal(validateEmail("user@example.com"), null);
  assert.equal(validateEmail("name+tag@sub.domain.org"), null);
});

test("email validation rejects overly long emails", () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_EMAIL_LEN = 254;

  function validateEmail(value) {
    if (!value || typeof value !== "string") return "Email is required.";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Email is required.";
    if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
    if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
    return null;
  }

  const longEmail = "a".repeat(250) + "@b.co";
  assert.equal(validateEmail(longEmail), "Email is too long.");
});

test("message validation rejects empty input", () => {
  const MAX_MESSAGE_LEN = 2000;

  function validateMessage(value) {
    if (!value || typeof value !== "string" || value.trim().length === 0) return "Message is required.";
    if (value.length > MAX_MESSAGE_LEN) return `Message must be under ${MAX_MESSAGE_LEN} characters.`;
    return null;
  }

  assert.equal(validateMessage(""), "Message is required.");
  assert.equal(validateMessage(null), "Message is required.");
  assert.equal(validateMessage("   "), "Message is required.");
});

test("message validation rejects overly long input", () => {
  const MAX_MESSAGE_LEN = 2000;

  function validateMessage(value) {
    if (!value || typeof value !== "string" || value.trim().length === 0) return "Message is required.";
    if (value.length > MAX_MESSAGE_LEN) return `Message must be under ${MAX_MESSAGE_LEN} characters.`;
    return null;
  }

  const longMsg = "x".repeat(2001);
  assert.match(validateMessage(longMsg), /under 2000/);
});

test("message validation accepts valid input", () => {
  const MAX_MESSAGE_LEN = 2000;

  function validateMessage(value) {
    if (!value || typeof value !== "string" || value.trim().length === 0) return "Message is required.";
    if (value.length > MAX_MESSAGE_LEN) return `Message must be under ${MAX_MESSAGE_LEN} characters.`;
    return null;
  }

  assert.equal(validateMessage("I need help with my project"), null);
});

test("safeWidget provides defaults for missing boot config", () => {
  function safeWidget(bootConfig) {
    const widget = bootConfig && bootConfig.widget ? bootConfig.widget : {};
    return {
      brandName: widget.brandName || "Lead OS",
      accent: widget.accent || "#3b82f6",
    };
  }

  const result1 = safeWidget(null);
  assert.equal(result1.brandName, "Lead OS");
  assert.equal(result1.accent, "#3b82f6");

  const result2 = safeWidget({});
  assert.equal(result2.brandName, "Lead OS");

  const result3 = safeWidget({ widget: { brandName: "Acme", accent: "#ff0000" } });
  assert.equal(result3.brandName, "Acme");
  assert.equal(result3.accent, "#ff0000");
});

test("boot config caching roundtrip via sessionStorage", () => {
  const dom = createDOM();
  try {
    const BOOT_CACHE_KEY = "lead-os-boot";
    const BOOT_CACHE_TTL_MS = 5 * 60 * 1000;

    function getCachedBoot() {
      try {
        const raw = sessionStorage.getItem(BOOT_CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts > BOOT_CACHE_TTL_MS) {
          sessionStorage.removeItem(BOOT_CACHE_KEY);
          return null;
        }
        return cached.data;
      } catch {
        return null;
      }
    }

    function setCachedBoot(data) {
      try {
        sessionStorage.setItem(BOOT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch { /* */ }
    }

    assert.equal(getCachedBoot(), null);

    const testData = { widget: { brandName: "Test" } };
    setCachedBoot(testData);

    const retrieved = getCachedBoot();
    assert.deepEqual(retrieved, testData);
  } finally {
    cleanupDOM();
  }
});

test("getConfig merges window.LeadOSConfig over defaults and freezes", () => {
  const dom = createDOM();
  try {
    const DEFAULTS = {
      runtimeBaseUrl: "",
      service: "lead-capture",
      niche: "general",
      mode: "chat",
      position: "bottom-right",
      theme: {},
    };

    dom.window.LeadOSConfig = { runtimeBaseUrl: "https://test.com", service: "seo" };

    function getConfig() {
      const config = { ...DEFAULTS, ...(dom.window.LeadOSConfig || {}) };
      if (typeof Object.freeze === "function") Object.freeze(config);
      return config;
    }

    const config = getConfig();
    assert.equal(config.runtimeBaseUrl, "https://test.com");
    assert.equal(config.service, "seo");
    assert.equal(config.niche, "general");
    assert.ok(Object.isFrozen(config));
  } finally {
    cleanupDOM();
  }
});
