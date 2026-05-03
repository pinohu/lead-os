import test from "node:test";
import assert from "node:assert/strict";
import { getRequestBaseUrl } from "../src/lib/request-base-url.ts";

test("getRequestBaseUrl prefers forwarded production host", () => {
  const request = new Request("http://internal.test/onboard", {
    headers: {
      "x-forwarded-host": "cxreact.com",
      "x-forwarded-proto": "https",
      host: "internal.test",
      origin: "https://wrong.example",
    },
  });

  assert.equal(getRequestBaseUrl(request), "https://cxreact.com");
});

test("getRequestBaseUrl keeps localhost on http for dev", () => {
  const request = new Request("http://localhost:3001/onboard", {
    headers: {
      host: "localhost:3001",
    },
  });

  assert.equal(getRequestBaseUrl(request), "http://localhost:3001");
});

test("getRequestBaseUrl ignores malformed forwarded host values", () => {
  const request = new Request("https://safe.example/onboard", {
    headers: {
      "x-forwarded-host": "evil.example/path",
      host: "safe.example",
    },
  });

  assert.equal(getRequestBaseUrl(request), "https://safe.example");
});
