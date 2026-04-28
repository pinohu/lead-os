import test from "node:test";
import assert from "node:assert/strict";
import {
  assertPublicHttpsTarget,
  isBlockedNetworkAddress,
} from "../src/lib/ssrf-guards.ts";

test("public HTTPS target guard rejects non-HTTPS targets", async () => {
  await assert.rejects(
    () => assertPublicHttpsTarget("http://example.com"),
    /Only HTTPS/,
  );
});

test("public HTTPS target guard rejects local and metadata hostnames", async () => {
  await assert.rejects(
    () => assertPublicHttpsTarget("https://localhost/admin"),
    /hostname/,
  );
  await assert.rejects(
    () => assertPublicHttpsTarget("https://metadata.google.internal/computeMetadata/v1"),
    /hostname/,
  );
});

test("public HTTPS target guard rejects direct IP literals", async () => {
  await assert.rejects(
    () => assertPublicHttpsTarget("https://127.0.0.1:3000"),
    /IP address targets/,
  );
  await assert.rejects(
    () => assertPublicHttpsTarget("https://169.254.169.254/latest/meta-data"),
    /IP address targets/,
  );
  await assert.rejects(
    () => assertPublicHttpsTarget("https://[::1]/"),
    /IP address targets/,
  );
});

test("public HTTPS target guard rejects hostnames resolving to restricted addresses", async () => {
  await assert.rejects(
    () => assertPublicHttpsTarget("https://example.com", {
      resolveHostname: async () => ["10.0.0.8"],
    }),
    /restricted network address/,
  );
});

test("public HTTPS target guard accepts public HTTPS hostnames", async () => {
  const url = await assertPublicHttpsTarget("https://example.com/path", {
    resolveHostname: async () => ["93.184.216.34"],
  });

  assert.equal(url.hostname, "example.com");
});

test("network address guard covers private, loopback, link-local, and metadata ranges", () => {
  assert.equal(isBlockedNetworkAddress("10.0.0.1"), true);
  assert.equal(isBlockedNetworkAddress("127.0.0.1"), true);
  assert.equal(isBlockedNetworkAddress("169.254.169.254"), true);
  assert.equal(isBlockedNetworkAddress("172.16.4.1"), true);
  assert.equal(isBlockedNetworkAddress("192.168.1.10"), true);
  assert.equal(isBlockedNetworkAddress("8.8.8.8"), false);
});
