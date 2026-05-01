import test from "node:test";
import assert from "node:assert/strict";
import { nicheCatalog } from "../src/lib/catalog.ts";
import { resolveExperienceProfile } from "../src/lib/experience.ts";

test("returning visitors get lighter form-first momentum by default", () => {
  const profile = resolveExperienceProfile({
    niche: nicheCatalog.general,
    returning: true,
    supportEmail: "support@yourdeputy.com",
  });

  assert.equal(profile.mode, "form-first");
  assert.match(profile.progressLabel, /welcome back/i);
});

test("high-intent qualification paths bias toward booking-first", () => {
  const profile = resolveExperienceProfile({
    family: "qualification",
    niche: nicheCatalog["home-services"],
    intent: "solve-now",
    score: 92,
    supportEmail: "support@yourdeputy.com",
  });

  assert.equal(profile.mode, "booking-first");
  assert.equal(profile.primaryActionHref, "/assess/home-services?mode=booking-first");
});

test("mobile discover traffic can bias toward chat-first guidance", () => {
  const profile = resolveExperienceProfile({
    niche: nicheCatalog.coaching,
    source: "messenger",
    intent: "discover",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X)",
    supportEmail: "support@yourdeputy.com",
  });

  assert.equal(profile.mode, "chat-first");
  assert.equal(profile.device, "mobile");
});

test("industry experience copy avoids placeholder and malformed trust language", () => {
  for (const niche of Object.values(nicheCatalog)) {
    const profile = resolveExperienceProfile({
      niche,
      source: "industry-page",
      intent: "discover",
      supportEmail: "support@yourdeputy.com",
    });

    const visibleCopy = [
      profile.heroTitle,
      profile.heroSummary,
      profile.trustPromise,
      profile.anxietyReducer,
      profile.returnOffer,
      ...profile.proofSignals,
      ...profile.supportingSignals,
    ].join("\n");

    assert.doesNotMatch(visibleCopy, /Used by X|No no|LeadOS shifts/i, `${niche.slug} has malformed trust copy`);
  }
});
