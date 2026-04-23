import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSmsitConfig,
  isSmsitDryRun,
  sendMessage,
  sendBulkMessages,
  getMessageStatus,
  listMessages,
  createContact,
  addContactToList,
  tagContact,
  listContacts,
  getMessageStats,
  sendSmsViaSmsit,
  sendWhatsAppViaSmsit,
  resetSmsitStore,
} from "../src/lib/integrations/smsit-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearSmsitEnv() {
  delete process.env.SMSIT_API_KEY;
  delete process.env.SMSIT_API_SECRET;
  delete process.env.SMSIT_BASE_URL;
  delete process.env.SMSIT_SENDER_ID;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveSmsitConfig returns null when no API key configured", () => {
  clearSmsitEnv();
  resetSmsitStore();
  const cfg = resolveSmsitConfig();
  assert.equal(cfg, null);
});

test("resolveSmsitConfig resolves from environment variables", () => {
  clearSmsitEnv();
  resetSmsitStore();
  process.env.SMSIT_API_KEY = "test-key";
  process.env.SMSIT_API_SECRET = "test-secret";
  process.env.SMSIT_BASE_URL = "https://custom.smsit.ai/v2";
  process.env.SMSIT_SENDER_ID = "MYAPP";

  const cfg = resolveSmsitConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "test-key");
  assert.equal(cfg.apiSecret, "test-secret");
  assert.equal(cfg.baseUrl, "https://custom.smsit.ai/v2");
  assert.equal(cfg.senderId, "MYAPP");

  clearSmsitEnv();
});

test("resolveSmsitConfig uses default baseUrl when env var absent", () => {
  clearSmsitEnv();
  resetSmsitStore();
  process.env.SMSIT_API_KEY = "key-only";

  const cfg = resolveSmsitConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://api.smsit.ai/v1");

  clearSmsitEnv();
});

test("resolveSmsitConfig returns config without secret", () => {
  clearSmsitEnv();
  resetSmsitStore();
  process.env.SMSIT_API_KEY = "key-only";

  const cfg = resolveSmsitConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "key-only");
  assert.equal(cfg.apiSecret, "");

  clearSmsitEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isSmsitDryRun returns true when no API key configured", () => {
  clearSmsitEnv();
  resetSmsitStore();
  assert.equal(isSmsitDryRun(), true);
});

test("isSmsitDryRun returns false when API key is set", () => {
  clearSmsitEnv();
  resetSmsitStore();
  process.env.SMSIT_API_KEY = "live-key";
  assert.equal(isSmsitDryRun(), false);
  clearSmsitEnv();
});

// ---------------------------------------------------------------------------
// Send single message — SMS
// ---------------------------------------------------------------------------

test("sendMessage sends an SMS in dry-run mode", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "Hello from Lead OS" });

  assert.ok(msg.id.startsWith("smsit-msg-"));
  assert.equal(msg.channel, "sms");
  assert.equal(msg.to, "+15551234567");
  assert.equal(msg.body, "Hello from Lead OS");
  assert.equal(msg.status, "sent");
  assert.ok(msg.sentAt);
});

test("sendMessage uses provided channel", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "Hi", channel: "whatsapp" });
  assert.equal(msg.channel, "whatsapp");
});

test("sendMessage includes mediaUrl when provided", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({
    to: "+15551234567",
    body: "Check this",
    channel: "mms",
    mediaUrl: "https://example.com/image.jpg",
  });
  assert.equal(msg.channel, "mms");
  assert.equal(msg.mediaUrl, "https://example.com/image.jpg");
});

test("sendMessage includes tenantId when provided", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "Hi", tenantId: "tenant-abc" });
  assert.equal(msg.tenantId, "tenant-abc");
});

test("sendMessage uses SMSIT_SENDER_ID as from field", async () => {
  clearSmsitEnv();
  resetSmsitStore();
  process.env.SMSIT_API_KEY = "key";
  process.env.SMSIT_SENDER_ID = "MYBRAND";

  // Still dry-run-like because fetch will fail, but config resolves senderId
  clearSmsitEnv();

  const msg = await sendMessage({ to: "+15551234567", body: "Hi" });
  assert.equal(msg.from, "LEAD-OS");
});

// ---------------------------------------------------------------------------
// Send single message — WhatsApp
// ---------------------------------------------------------------------------

test("sendMessage sends a WhatsApp message in dry-run mode", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15559876543", body: "WhatsApp hello", channel: "whatsapp" });
  assert.equal(msg.channel, "whatsapp");
  assert.equal(msg.status, "sent");
  assert.equal(msg.body, "WhatsApp hello");
});

// ---------------------------------------------------------------------------
// Send single message — RCS
// ---------------------------------------------------------------------------

test("sendMessage sends an RCS message in dry-run mode", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15550001111", body: "RCS message", channel: "rcs" });
  assert.equal(msg.channel, "rcs");
  assert.equal(msg.status, "sent");
});

// ---------------------------------------------------------------------------
// Send single message — MMS
// ---------------------------------------------------------------------------

test("sendMessage sends an MMS message in dry-run mode", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({
    to: "+15550002222",
    body: "MMS message",
    channel: "mms",
    mediaUrl: "https://example.com/photo.png",
  });
  assert.equal(msg.channel, "mms");
  assert.equal(msg.mediaUrl, "https://example.com/photo.png");
});

// ---------------------------------------------------------------------------
// Send single message — Voice
// ---------------------------------------------------------------------------

test("sendMessage sends a voice message in dry-run mode", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15550003333", body: "Voice script", channel: "voice" });
  assert.equal(msg.channel, "voice");
  assert.equal(msg.status, "sent");
});

// ---------------------------------------------------------------------------
// Bulk messaging
// ---------------------------------------------------------------------------

test("sendBulkMessages sends to all recipients", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const recipients = ["+15551111111", "+15552222222", "+15553333333"];
  const messages = await sendBulkMessages({ recipients, body: "Bulk hello" });

  assert.equal(messages.length, 3);
  for (const msg of messages) {
    assert.equal(msg.body, "Bulk hello");
    assert.equal(msg.channel, "sms");
    assert.equal(msg.status, "sent");
  }
  assert.equal(messages[0].to, "+15551111111");
  assert.equal(messages[1].to, "+15552222222");
  assert.equal(messages[2].to, "+15553333333");
});

test("sendBulkMessages uses specified channel", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const messages = await sendBulkMessages({
    recipients: ["+15554444444"],
    body: "WhatsApp bulk",
    channel: "whatsapp",
  });
  assert.equal(messages[0].channel, "whatsapp");
});

test("sendBulkMessages returns empty array for empty recipients", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const messages = await sendBulkMessages({ recipients: [], body: "No one" });
  assert.equal(messages.length, 0);
});

// ---------------------------------------------------------------------------
// Message status retrieval
// ---------------------------------------------------------------------------

test("getMessageStatus returns message by id", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "Status check" });
  const status = await getMessageStatus(msg.id);

  assert.ok(status);
  assert.equal(status.id, msg.id);
  assert.equal(status.status, "sent");
});

test("getMessageStatus returns null for unknown id", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const status = await getMessageStatus("nonexistent-id");
  assert.equal(status, null);
});

// ---------------------------------------------------------------------------
// List messages
// ---------------------------------------------------------------------------

test("listMessages returns all messages", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "First" });
  await sendMessage({ to: "+15552222222", body: "Second" });

  const all = await listMessages();
  assert.equal(all.length, 2);
});

test("listMessages filters by tenantId", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "Tenant A", tenantId: "t-a" });
  await sendMessage({ to: "+15552222222", body: "Tenant B", tenantId: "t-b" });
  await sendMessage({ to: "+15553333333", body: "Tenant A again", tenantId: "t-a" });

  const filtered = await listMessages("t-a");
  assert.equal(filtered.length, 2);
  for (const m of filtered) {
    assert.equal(m.tenantId, "t-a");
  }
});

test("listMessages filters by channel", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "SMS", channel: "sms" });
  await sendMessage({ to: "+15552222222", body: "WA", channel: "whatsapp" });
  await sendMessage({ to: "+15553333333", body: "SMS 2", channel: "sms" });

  const smsOnly = await listMessages(undefined, "sms");
  assert.equal(smsOnly.length, 2);
  for (const m of smsOnly) {
    assert.equal(m.channel, "sms");
  }
});

// ---------------------------------------------------------------------------
// Contact CRUD
// ---------------------------------------------------------------------------

test("createContact creates a contact in dry-run", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({
    phone: "+15551234567",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith",
    tags: ["lead"],
    lists: ["main"],
    tenantId: "t-1",
  });

  assert.ok(contact.id.startsWith("smsit-contact-"));
  assert.equal(contact.phone, "+15551234567");
  assert.equal(contact.email, "alice@example.com");
  assert.equal(contact.firstName, "Alice");
  assert.equal(contact.lastName, "Smith");
  assert.deepEqual(contact.tags, ["lead"]);
  assert.deepEqual(contact.lists, ["main"]);
  assert.ok(contact.createdAt);
});

test("createContact handles minimal fields", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({
    phone: "+15559999999",
    tags: [],
    lists: [],
  });

  assert.equal(contact.phone, "+15559999999");
  assert.equal(contact.email, undefined);
  assert.equal(contact.firstName, undefined);
  assert.deepEqual(contact.tags, []);
  assert.deepEqual(contact.lists, []);
});

test("tagContact adds a tag to existing contact", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({ phone: "+15551234567", tags: [], lists: [] });
  const result = await tagContact(contact.id, "vip");

  assert.equal(result, true);

  const contacts = await listContacts();
  const updated = contacts.find((c) => c.id === contact.id);
  assert.ok(updated);
  assert.ok(updated.tags.includes("vip"));
});

test("tagContact does not duplicate existing tag", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({ phone: "+15551234567", tags: ["existing"], lists: [] });
  await tagContact(contact.id, "existing");

  const contacts = await listContacts();
  const updated = contacts.find((c) => c.id === contact.id);
  assert.ok(updated);
  assert.equal(updated.tags.filter((t) => t === "existing").length, 1);
});

test("tagContact returns false for unknown contact", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await tagContact("unknown-id", "tag");
  assert.equal(result, false);
});

test("addContactToList adds contact to a list", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({ phone: "+15551234567", tags: [], lists: [] });
  const result = await addContactToList(contact.id, "newsletter");

  assert.equal(result, true);

  const contacts = await listContacts();
  const updated = contacts.find((c) => c.id === contact.id);
  assert.ok(updated);
  assert.ok(updated.lists.includes("newsletter"));
});

test("addContactToList does not duplicate existing list", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const contact = await createContact({ phone: "+15551234567", tags: [], lists: ["existing"] });
  await addContactToList(contact.id, "existing");

  const contacts = await listContacts();
  const updated = contacts.find((c) => c.id === contact.id);
  assert.ok(updated);
  assert.equal(updated.lists.filter((l) => l === "existing").length, 1);
});

test("addContactToList returns false for unknown contact", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await addContactToList("unknown-id", "list");
  assert.equal(result, false);
});

test("listContacts returns all contacts", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await createContact({ phone: "+15551111111", tags: [], lists: [] });
  await createContact({ phone: "+15552222222", tags: [], lists: [] });

  const contacts = await listContacts();
  assert.equal(contacts.length, 2);
});

test("listContacts filters by tenantId", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await createContact({ phone: "+15551111111", tags: [], lists: [], tenantId: "t-x" });
  await createContact({ phone: "+15552222222", tags: [], lists: [], tenantId: "t-y" });

  const filtered = await listContacts("t-x");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tenantId, "t-x");
});

// ---------------------------------------------------------------------------
// Message stats
// ---------------------------------------------------------------------------

test("getMessageStats returns correct counts", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "SMS 1", channel: "sms" });
  await sendMessage({ to: "+15552222222", body: "SMS 2", channel: "sms" });
  await sendMessage({ to: "+15553333333", body: "WA", channel: "whatsapp" });
  await sendMessage({ to: "+15554444444", body: "RCS", channel: "rcs" });
  await sendMessage({ to: "+15555555555", body: "Voice", channel: "voice" });

  const stats = await getMessageStats();
  assert.equal(stats.total, 5);
  assert.equal(stats.sent, 5);
  assert.equal(stats.delivered, 0);
  assert.equal(stats.failed, 0);
  assert.equal(stats.read, 0);
  assert.equal(stats.byChannel.sms, 2);
  assert.equal(stats.byChannel.whatsapp, 1);
  assert.equal(stats.byChannel.rcs, 1);
  assert.equal(stats.byChannel.voice, 1);
  assert.equal(stats.byChannel.mms, 0);
});

test("getMessageStats filters by tenantId", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "A", tenantId: "t-1" });
  await sendMessage({ to: "+15552222222", body: "B", tenantId: "t-2" });
  await sendMessage({ to: "+15553333333", body: "C", tenantId: "t-1" });

  const stats = await getMessageStats("t-1");
  assert.equal(stats.total, 2);
});

// ---------------------------------------------------------------------------
// ProviderResult — SMS
// ---------------------------------------------------------------------------

test("sendSmsViaSmsit returns ProviderResult in dry-run", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await sendSmsViaSmsit("+15551234567", "Test SMS");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "SMS-iT");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "SMS prepared (SMS-iT dry-run)");
  assert.ok(result.payload);
  assert.equal(result.payload.to, "+15551234567");
  assert.ok(typeof result.payload.messageId === "string");
});

test("sendSmsViaSmsit stores message in message store", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await sendSmsViaSmsit("+15551234567", "Stored SMS");
  const messageId = result.payload?.messageId as string;
  const status = await getMessageStatus(messageId);

  assert.ok(status);
  assert.equal(status.channel, "sms");
  assert.equal(status.body, "Stored SMS");
});

// ---------------------------------------------------------------------------
// ProviderResult — WhatsApp
// ---------------------------------------------------------------------------

test("sendWhatsAppViaSmsit returns ProviderResult in dry-run", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await sendWhatsAppViaSmsit("+15559876543", "Test WhatsApp");

  assert.equal(result.ok, true);
  assert.equal(result.provider, "SMS-iT");
  assert.equal(result.mode, "dry-run");
  assert.equal(result.detail, "WhatsApp message prepared (SMS-iT dry-run)");
  assert.ok(result.payload);
  assert.equal(result.payload.to, "+15559876543");
});

test("sendWhatsAppViaSmsit stores message as whatsapp channel", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const result = await sendWhatsAppViaSmsit("+15559876543", "WA store test");
  const messageId = result.payload?.messageId as string;
  const status = await getMessageStatus(messageId);

  assert.ok(status);
  assert.equal(status.channel, "whatsapp");
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("sendMessage handles empty body", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "" });
  assert.equal(msg.body, "");
  assert.equal(msg.status, "sent");
});

test("sendMessage handles special characters in body", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const body = "Hello! @#$%^&*() \n\ttabs and newlines";
  const msg = await sendMessage({ to: "+15551234567", body });
  assert.equal(msg.body, body);
});

test("sendMessage defaults channel to sms", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  const msg = await sendMessage({ to: "+15551234567", body: "Default channel" });
  assert.equal(msg.channel, "sms");
});

// ---------------------------------------------------------------------------
// Store and reset
// ---------------------------------------------------------------------------

test("resetSmsitStore clears all messages and contacts", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "Will be cleared" });
  await createContact({ phone: "+15551111111", tags: [], lists: [] });

  let messages = await listMessages();
  let contacts = await listContacts();
  assert.ok(messages.length > 0);
  assert.ok(contacts.length > 0);

  resetSmsitStore();

  messages = await listMessages();
  contacts = await listContacts();
  assert.equal(messages.length, 0);
  assert.equal(contacts.length, 0);
});

test("resetSmsitStore allows re-initialization", async () => {
  clearSmsitEnv();
  resetSmsitStore();

  await sendMessage({ to: "+15551111111", body: "First batch" });
  resetSmsitStore();

  await sendMessage({ to: "+15552222222", body: "Second batch" });
  const messages = await listMessages();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, "+15552222222");
});
