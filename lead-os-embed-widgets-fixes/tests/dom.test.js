import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

function setupDOM() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.com/page",
    pretendToBeVisual: true,
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.sessionStorage = dom.window.sessionStorage;
  global.HTMLElement = dom.window.HTMLElement;
  global.AbortController = dom.window.AbortController;
  global.fetch = () => Promise.reject(new Error("fetch not mocked"));
  return dom;
}

function teardownDOM() {
  delete global.window;
  delete global.document;
  delete global.sessionStorage;
  delete global.HTMLElement;
  delete global.AbortController;
  delete global.fetch;
}

async function loadSource() {
  const cacheBuster = `?t=${Date.now()}-${Math.random()}`;
  const mod = await import(`../src/index.js${cacheBuster}`);
  return mod;
}

test("createElement builds DOM nodes with attributes", async () => {
  setupDOM();
  try {
    const { createElement } = await loadSource();
    const el = createElement("div", { id: "test", "data-x": "y" }, ["Hello"]);
    assert.equal(el.tagName, "DIV");
    assert.equal(el.id, "test");
    assert.equal(el.getAttribute("data-x"), "y");
    assert.equal(el.textContent, "Hello");
  } finally {
    teardownDOM();
  }
});

test("createElement applies inline styles", async () => {
  setupDOM();
  try {
    const { createElement } = await loadSource();
    const el = createElement("span", { style: { color: "red", fontWeight: "700" } });
    assert.equal(el.style.color, "red");
    assert.equal(el.style.fontWeight, "700");
  } finally {
    teardownDOM();
  }
});

test("createElement registers event listeners via on* attrs", async () => {
  setupDOM();
  try {
    const { createElement } = await loadSource();
    let clicked = false;
    const btn = createElement("button", { onClick: () => { clicked = true; } });
    btn.click();
    assert.equal(clicked, true);
  } finally {
    teardownDOM();
  }
});

test("validateEmail rejects empty/null/whitespace", async () => {
  setupDOM();
  try {
    const { validateEmail } = await loadSource();
    assert.equal(validateEmail(""), "Email is required.");
    assert.equal(validateEmail(null), "Email is required.");
    assert.equal(validateEmail(undefined), "Email is required.");
    assert.equal(validateEmail("   "), "Email is required.");
  } finally {
    teardownDOM();
  }
});

test("validateEmail rejects invalid formats", async () => {
  setupDOM();
  try {
    const { validateEmail } = await loadSource();
    assert.equal(validateEmail("notanemail"), "Please enter a valid email address.");
    assert.equal(validateEmail("missing@dot"), "Please enter a valid email address.");
    assert.equal(validateEmail("@no-local.com"), "Please enter a valid email address.");
  } finally {
    teardownDOM();
  }
});

test("validateEmail accepts valid emails", async () => {
  setupDOM();
  try {
    const { validateEmail } = await loadSource();
    assert.equal(validateEmail("user@example.com"), null);
    assert.equal(validateEmail("name+tag@sub.domain.org"), null);
  } finally {
    teardownDOM();
  }
});

test("validateEmail rejects overly long emails", async () => {
  setupDOM();
  try {
    const { validateEmail } = await loadSource();
    assert.equal(validateEmail("a".repeat(250) + "@b.co"), "Email is too long.");
  } finally {
    teardownDOM();
  }
});

test("validateMessage rejects empty/null/whitespace", async () => {
  setupDOM();
  try {
    const { validateMessage } = await loadSource();
    assert.equal(validateMessage(""), "Message is required.");
    assert.equal(validateMessage(null), "Message is required.");
    assert.equal(validateMessage("   "), "Message is required.");
  } finally {
    teardownDOM();
  }
});

test("validateMessage rejects overly long input", async () => {
  setupDOM();
  try {
    const { validateMessage } = await loadSource();
    assert.match(validateMessage("x".repeat(2001)), /under 2000/);
  } finally {
    teardownDOM();
  }
});

test("validateMessage accepts valid input", async () => {
  setupDOM();
  try {
    const { validateMessage } = await loadSource();
    assert.equal(validateMessage("I need help"), null);
  } finally {
    teardownDOM();
  }
});

test("safeWidget provides defaults for missing boot config", async () => {
  setupDOM();
  try {
    const { safeWidget } = await loadSource();
    const r1 = safeWidget(null);
    assert.equal(r1.brandName, "Lead OS");
    assert.equal(r1.accent, "#3b82f6");

    const r2 = safeWidget({});
    assert.equal(r2.brandName, "Lead OS");

    const r3 = safeWidget({ widget: { brandName: "Acme", accent: "#ff0000" } });
    assert.equal(r3.brandName, "Acme");
    assert.equal(r3.accent, "#ff0000");
  } finally {
    teardownDOM();
  }
});

test("safeWidget rejects non-hex accent values", async () => {
  setupDOM();
  try {
    const { safeWidget } = await loadSource();
    const r1 = safeWidget({ widget: { accent: "url(evil)" } });
    assert.equal(r1.accent, "#3b82f6");

    const r2 = safeWidget({ widget: { accent: "red" } });
    assert.equal(r2.accent, "#3b82f6");

    const r3 = safeWidget({ widget: { accent: "#abc" } });
    assert.equal(r3.accent, "#abc");
  } finally {
    teardownDOM();
  }
});

test("getConfig merges window.LeadOSConfig and freezes", async () => {
  setupDOM();
  try {
    window.LeadOSConfig = { runtimeBaseUrl: "https://test.com", service: "seo" };
    const { getConfig } = await loadSource();
    const config = getConfig();
    assert.equal(config.runtimeBaseUrl, "https://test.com");
    assert.equal(config.service, "seo");
    assert.equal(config.niche, "general");
    assert.ok(Object.isFrozen(config));
  } finally {
    teardownDOM();
  }
});

test("boot config caching roundtrip via sessionStorage", async () => {
  setupDOM();
  try {
    const BOOT_CACHE_KEY = "lead-os-boot";
    assert.equal(sessionStorage.getItem(BOOT_CACHE_KEY), null);

    const testData = { widget: { brandName: "Test" } };
    sessionStorage.setItem(BOOT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: testData }));

    const raw = JSON.parse(sessionStorage.getItem(BOOT_CACHE_KEY));
    assert.deepEqual(raw.data, testData);
  } finally {
    teardownDOM();
  }
});
