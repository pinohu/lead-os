import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const bundlePath = path.join(process.cwd(), "dist", "lead-os-embed.js");
const bundleExists = fs.existsSync(bundlePath);

test("built bundle exists", () => {
  assert.ok(bundleExists, "dist/lead-os-embed.js must exist — run npm run build first");
});

test("built bundle has no ES module export statements", { skip: !bundleExists }, () => {
  const bundle = fs.readFileSync(bundlePath, "utf8");
  assert.doesNotMatch(bundle, /^export /m);
});

test("built bundle renders launcher into DOM", { skip: !bundleExists }, async () => {
  const bundle = fs.readFileSync(bundlePath, "utf8");

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <script>
        window.LeadOSConfig = {
          runtimeBaseUrl: "https://test.example.com",
          service: "test-svc",
          niche: "test-niche"
        };
      </script>
    </body></html>`,
    {
      url: "https://host-site.com/page",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      resources: "usable",
    },
  );

  const fetchCalls = [];
  dom.window.fetch = (url, opts) => {
    fetchCalls.push({ url, opts });
    if (typeof url === "string" && url.includes("/api/widgets/boot")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ widget: { brandName: "TestBrand", accent: "#22c55e" } }),
      });
    }
    if (typeof url === "string" && url.includes("/api/intake")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  };

  dom.window.eval(bundle);

  await new Promise((r) => setTimeout(r, 200));

  const launcher = dom.window.document.querySelector(".lead-os-launcher");
  assert.ok(launcher, "Launcher button should be in the DOM");
  assert.equal(launcher.getAttribute("aria-haspopup"), "dialog");
  assert.equal(launcher.getAttribute("aria-expanded"), "false");
  assert.equal(launcher.getAttribute("title"), "Open Lead OS widget");

  assert.ok(fetchCalls.length >= 1, "Should have fetched boot config");
  assert.ok(fetchCalls[0].url.includes("/api/widgets/boot"), "First fetch should be boot config");

  await new Promise((r) => setTimeout(r, 200));
  const bgAfterBoot = launcher.style.background;
  assert.ok(
    bgAfterBoot === "#22c55e" || bgAfterBoot === "rgb(34, 197, 94)",
    `Launcher should update to boot config accent, got: ${bgAfterBoot}`,
  );

  launcher.click();
  await new Promise((r) => setTimeout(r, 50));

  const drawer = dom.window.document.querySelector('[role="dialog"]');
  assert.ok(drawer, "Drawer should be in the DOM after click");
  assert.notEqual(drawer.style.display, "none", "Drawer should be visible");
  assert.ok(drawer.getAttribute("aria-label").includes("TestBrand"), "Drawer should use boot config brandName");

  const closeBtn = drawer.querySelector('[aria-label="Close widget"]');
  assert.ok(closeBtn, "Close button should exist in drawer");

  const emailInput = drawer.querySelector('input[type="email"]');
  const textarea = drawer.querySelector("textarea");
  assert.ok(emailInput, "Email input should exist");
  assert.ok(textarea, "Textarea should exist");

  const emailLabel = drawer.querySelector(`label[for="${emailInput.id}"]`);
  const msgLabel = drawer.querySelector(`label[for="${textarea.id}"]`);
  assert.ok(emailLabel, "Email label should reference email input ID");
  assert.ok(msgLabel, "Message label should reference textarea ID");

  const feedback = drawer.querySelector('[role="status"]');
  assert.ok(feedback, "Feedback region should exist");
  assert.ok(emailInput.getAttribute("aria-describedby") === feedback.id, "Email should reference feedback via aria-describedby");

  const styles = dom.window.document.getElementById("lead-os-embed-styles");
  assert.ok(styles, "Injected style block should exist");
  assert.ok(styles.textContent.includes("focus-visible"), "Styles should include focus-visible rules");
  assert.ok(styles.textContent.includes("::placeholder"), "Styles should include placeholder color rules");
  assert.ok(styles.textContent.includes("disabled"), "Styles should include disabled button rules");

  assert.ok(drawer.style.maxHeight, "Drawer should have max-height for scrollability");
  assert.ok(drawer.style.overflowY, "Drawer should have overflow-y for scrollability");

  const separator = drawer.querySelector("hr");
  assert.ok(separator, "Visual separator should exist before assessment link");

  dom.window.close();
});

test("built bundle form submission flow", { skip: !bundleExists }, async () => {
  const bundle = fs.readFileSync(bundlePath, "utf8");

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <script>
        window.LeadOSConfig = { runtimeBaseUrl: "https://test.example.com" };
      </script>
    </body></html>`,
    {
      url: "https://host-site.com/contact",
      runScripts: "dangerously",
      pretendToBeVisual: true,
    },
  );

  let intakePayload = null;
  dom.window.fetch = (url, opts) => {
    if (typeof url === "string" && url.includes("/api/widgets/boot")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ widget: { brandName: "Test", accent: "#3b82f6" } }),
      });
    }
    if (typeof url === "string" && url.includes("/api/intake")) {
      intakePayload = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  };

  dom.window.eval(bundle);
  await new Promise((r) => setTimeout(r, 300));

  const launcher = dom.window.document.querySelector(".lead-os-launcher");
  launcher.click();
  await new Promise((r) => setTimeout(r, 50));

  const drawer = dom.window.document.querySelector('[role="dialog"]');
  const emailInput = drawer.querySelector('input[type="email"]');
  const textarea = drawer.querySelector("textarea");
  const submitBtn = Array.from(drawer.querySelectorAll("button")).find((b) => b.textContent === "Submit Lead");
  const feedback = drawer.querySelector('[role="status"]');

  submitBtn.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(feedback.textContent.includes("Email is required"), "Should show email validation error");

  emailInput.value = "bad-email";
  submitBtn.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(feedback.textContent.includes("valid email"), "Should show format validation error");

  emailInput.value = "user@test.com";
  submitBtn.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(feedback.textContent.includes("Message is required"), "Should show message validation error");

  emailInput.value = "user@test.com";
  textarea.value = "I need help with my project";
  submitBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  assert.ok(intakePayload, "Intake API should have been called");
  assert.equal(intakePayload.email, "user@test.com");
  assert.equal(intakePayload.message, "I need help with my project");
  assert.equal(intakePayload.source, "embedded_widget");
  assert.equal(intakePayload.metadata.origin, "https://host-site.com");
  assert.equal(intakePayload.metadata.pathname, "/contact");

  assert.ok(feedback.textContent.includes("successfully"), "Should show success message");

  dom.window.close();
});
