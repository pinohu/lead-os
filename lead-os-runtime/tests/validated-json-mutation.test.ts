// tests/validated-json-mutation.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { readJsonBody, validateWithSchema } from "../src/lib/api/validated-json.ts";

describe("validated-json helpers", () => {
  it("readJsonBody rejects non-JSON content type", async () => {
    const req = new Request("https://x/a", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "nope",
    });
    const r = await readJsonBody(req);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.response.status, 415);
  });

  it("validateWithSchema returns 422 on invalid payload", () => {
    const schema = z.object({ name: z.string().min(1) });
    const r = validateWithSchema({}, schema);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.response.status, 422);
  });
});
