import test from "node:test";
import assert from "node:assert/strict";
import { handleIntakePost } from "../src/lib/intake-route.ts";
import { tenantConfig } from "../src/lib/tenant.ts";

test("intake POST rejects disallowed CORS origins before parsing or persisting", async () => {
  const originalOrigins = tenantConfig.widgetOrigins;
  tenantConfig.widgetOrigins = ["https://trusted.example.com"];
  let parsed = false;
  let persisted = false;

  try {
    const response = await handleIntakePost(
      {
        headers: new Headers({ origin: "https://evil.example.com" }),
        async json() {
          parsed = true;
          throw new Error("request body should not be parsed");
        },
      },
      async () => {
        persisted = true;
        return { success: true };
      },
    );

    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal(parsed, false);
    assert.equal(persisted, false);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Origin is not allowed for lead intake.",
    });
  } finally {
    tenantConfig.widgetOrigins = originalOrigins;
  }
});

test("intake POST accepts allowed CORS origins and echoes CORS headers", async () => {
  const originalOrigins = tenantConfig.widgetOrigins;
  tenantConfig.widgetOrigins = ["https://trusted.example.com"];
  let receivedPayload: unknown = null;

  try {
    const request = new Request("https://leads.example.com/api/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://trusted.example.com",
      },
      body: JSON.stringify({
        source: "chat",
        email: "lead@example.com",
      }),
    });

    const response = await handleIntakePost(request, async (payload) => {
      receivedPayload = payload;
      return { success: true, leadKey: "email:lead@example.com" };
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://trusted.example.com");
    assert.deepEqual(receivedPayload, {
      source: "chat",
      email: "lead@example.com",
    });
    assert.deepEqual(await response.json(), {
      success: true,
      leadKey: "email:lead@example.com",
    });
  } finally {
    tenantConfig.widgetOrigins = originalOrigins;
  }
});
