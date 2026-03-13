import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeWebsite,
  manifestToEnvExample,
  synthesizeLeadOsManifest,
} from "../src/lib/website-intelligence.ts";

const lawFirmHtml = `
  <html>
    <head>
      <title>Elevate Immigration Law | Client Intake and Case Workflows</title>
      <meta name="description" content="Immigration law firm growth systems with multilingual intake, client portal automation, and consultation booking." />
    </head>
    <body>
      <nav>
        <a href="/services">Services</a>
        <a href="/pricing">Pricing</a>
        <a href="/case-studies">Case Studies</a>
        <a href="/contact">Contact</a>
      </nav>
      <h1>Book a consultation for your immigration workflow transformation</h1>
      <h2>Multilingual client intake for visa and case management</h2>
      <button>Book a Call</button>
      <button>Request Proposal</button>
      <section>Trusted by immigration attorneys who want secure intake and automated case updates.</section>
    </body>
  </html>
`;

const webinarHtml = `
  <html>
    <head>
      <title>Compliance Growth Academy</title>
      <meta name="description" content="Register for our compliance webinar and learn how to launch recurring training revenue." />
    </head>
    <body>
      <nav>
        <a href="/webinar">Webinar</a>
        <a href="/resources">Resources</a>
        <a href="/about">About</a>
      </nav>
      <h1>Join our live webinar on productized compliance training</h1>
      <button>Save My Seat</button>
      <button>Download the Playbook</button>
      <section>Courses, certifications, LMS operations, and reseller growth.</section>
    </body>
  </html>
`;

test("website intelligence infers a professional-services legal funnel", () => {
  const analysis = analyzeWebsite({
    url: "https://elevateimmigration.com",
    html: lawFirmHtml,
  });

  assert.equal(analysis.business.presetId, "professional-services");
  assert.equal(analysis.business.primaryGoal, "book-call");
  assert.ok(analysis.business.serviceSlugs.includes("immigration-law"));
  assert.ok(analysis.funnel.recommendedBlueprints.includes("high-ticket-call"));
  assert.ok(analysis.architecture.hasPricing);
});

test("website intelligence infers an education-led webinar business", () => {
  const analysis = analyzeWebsite({
    url: "https://compliancegrowthacademy.com",
    html: webinarHtml,
  });

  assert.equal(analysis.business.presetId, "education-compliance");
  assert.equal(analysis.business.primaryGoal, "register-webinar");
  assert.ok(analysis.funnel.recommendedBlueprints.includes("webinar-live"));
  assert.ok(analysis.funnel.recommendedIntakeBias.includes("webinar"));
});

test("manifest synthesis turns analysis into env-ready config", () => {
  const analysis = analyzeWebsite({
    url: "https://elevateimmigration.com",
    html: lawFirmHtml,
  });
  const manifest = synthesizeLeadOsManifest(analysis);
  const envExample = manifestToEnvExample(manifest);

  assert.equal(manifest.presetId, "professional-services");
  assert.match(envExample, /NEXT_PUBLIC_TENANT_PRESET=professional-services/);
  assert.match(envExample, /NEXT_PUBLIC_ENABLED_SERVICES=/);
});
