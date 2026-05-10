const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/VRLab/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const ACCOUNT_ID = "91123097";
const SITE_ID = "8358";
const DASHBOARD_URL = `https://app.convertbox.com/app/${ACCOUNT_ID}/${SITE_ID}/dashboard`;
const ROOT = path.join(__dirname, "..");
const IMPLEMENTATION_DIR = path.join(ROOT, "docs", "erie-pro-consolidation", "convertbox-implementation");
const ACTIVATION_PATH = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-112-ACTIVATION.json");
const OUT_JSON = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-SUBMIT-TRACKING.json");
const OUT_MD = path.join(IMPLEMENTATION_DIR, "ERIE-CONVERTBOX-SUBMIT-TRACKING.md");

function usage() {
  console.log("Usage: node scripts/apply-erie-convertbox-submit-tracking.js [--limit=3] [--dry-run]");
}

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function hasArg(name) {
  return process.argv.includes(`--${name}`);
}

function scriptFor({ boxId, serviceSlug, serviceLabel, family, finalStepName }) {
  return `
(function () {
  function text(value) {
    return (value == null ? "" : String(value)).trim();
  }
  function fieldValue(names) {
    for (var i = 0; i < names.length; i += 1) {
      var selector = '[name="' + names[i] + '"], [data-name="' + names[i] + '"], [placeholder*="' + names[i] + '" i]';
      var node = document.querySelector(selector);
      if (node && "value" in node && text(node.value)) return text(node.value);
    }
    return "";
  }
  function allFields() {
    var data = {};
    var nodes = document.querySelectorAll("input, textarea, select");
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var key = text(node.name || node.getAttribute("data-name") || node.getAttribute("placeholder") || node.type || ("field_" + i));
      if (!key) continue;
      data[key] = text(node.value);
    }
    return data;
  }
  var fields = allFields();
  var summary = [
    fieldValue(["request_context", "message", "details", "description"]),
    fieldValue(["zip_or_community", "zip", "community"]),
    fieldValue(["timing", "schedule", "preferred_time"])
  ].filter(Boolean).join(" | ");
  if (!summary) {
    summary = Object.keys(fields).map(function (key) { return key + ": " + fields[key]; }).filter(function (line) { return line.length > 2; }).join(" | ");
  }
  var payload = {
    eventType: "convertbox.lead_submitted",
    sourcePage: window.location.href,
    sourcePageType: (window.parent && window.parent.erieProConvertBox && window.parent.erieProConvertBox.pageType) || "convertbox",
    serviceSlug: ${JSON.stringify(serviceSlug)},
    serviceNiche: ${JSON.stringify(serviceSlug)},
    serviceLabel: ${JSON.stringify(serviceLabel)},
    family: ${JSON.stringify(family || null)},
    boxId: ${JSON.stringify(boxId)},
    actionType: "convertbox_final_form_submit",
    actionLabel: "Final ConvertBox request submitted",
    stepName: ${JSON.stringify(finalStepName || "Final request")},
    consumerEmail: fieldValue(["email", "work_email", "home_email"]),
    consumerPhone: fieldValue(["phone", "tel", "mobile", "cell"]),
    requestSummary: summary || ${JSON.stringify(`ConvertBox ${serviceLabel} request submitted`)},
    consentToContact: true,
    metadata: {
      fields: fields,
      convertBoxPatchedAt: "2026-05-10",
      convertBoxPatch: "erie-pro-final-submit-tracking"
    }
  };
  function sendToTracker(targetWindow) {
    try {
      if (targetWindow && typeof targetWindow.erieProTrackConvertBoxEvent === "function") {
        targetWindow.erieProTrackConvertBoxEvent("convertbox.lead_submitted", payload);
        return true;
      }
    } catch (_) {}
    return false;
  }
  var sent = sendToTracker(window) || sendToTracker(window.parent);
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: "erie-pro-convertbox",
        eventType: "convertbox.lead_submitted",
        payload: payload
      }, "https://erie.pro");
    } else if (!sent && window.postMessage) {
      window.postMessage({
        source: "erie-pro-convertbox",
        eventType: "convertbox.lead_submitted",
        payload: payload
      }, window.location.origin);
    }
  } catch (_) {}
})();`.trim();
}

function findFinalFormPatches(box, service) {
  const patches = [];
  for (const variation of box.variations || []) {
    const steps = variation.steps || [];
    const finalStep = steps[steps.length - 1];
    const finalStepId = finalStep?.id;
    if (!finalStepId) continue;

    for (const step of steps) {
      for (const region of ["center", "left", "right"]) {
        for (const element of step.elements?.[region] || []) {
          if (element.type !== "form") continue;
          const action = element.options?.action;
          if (!action || action.step !== finalStepId) continue;

          action.fire_scripts = true;
          action.scripts = scriptFor({
            boxId: box.id,
            serviceSlug: service.service_slug,
            serviceLabel: service.service_label,
            family: box.meta?.ep_service_family || service.family,
            finalStepName: step.name,
          });
          patches.push({
            variationId: variation.id || variation.name || null,
            stepId: step.id,
            stepName: step.name,
            formId: element.id,
          });
        }
      }
    }
  }
  return patches;
}

async function login(page, username, password) {
  await page.goto("https://app.convertbox.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.fill("input[type=email], input[name=email], input[name=username]", username);
  await page.fill("input[type=password], input[name=password]", password);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {}),
    page.click("button:has-text('Sign In'), input[type=submit]"),
  ]);
  await page.goto(DASHBOARD_URL, { waitUntil: "networkidle", timeout: 60000 });
}

async function api(page, url, options = {}) {
  return page.evaluate(async ({ url, options }) => {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json;charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        ...(options.headers || {}),
      },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    return { ok: res.ok, status: res.status, data, text: text.slice(0, 500) };
  }, { url, options });
}

async function getBox(page, id) {
  const res = await api(page, `https://app.convertbox.com/api/boxes/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(`GET box ${id} failed: ${res.status} ${res.text}`);
  return res.data.box || res.data.data || res.data;
}

async function saveBox(page, box) {
  const res = await api(page, `https://app.convertbox.com/api/boxes/${box.id}`, {
    method: "PUT",
    body: JSON.stringify(box),
  });
  if (!res.ok) throw new Error(`PUT box ${box.id} failed: ${res.status} ${res.text}`);
  return res.data.box || res.data.data || res.data;
}

async function main() {
  if (hasArg("help")) return usage();
  const username = process.env.CB_USER;
  const password = process.env.CB_PASSWORD;
  if (!username || !password) throw new Error("CB_USER and CB_PASSWORD are required.");

  const activation = JSON.parse(fs.readFileSync(ACTIVATION_PATH, "utf8"));
  const limit = argValue("limit") ? Number(argValue("limit")) : null;
  const dryRun = hasArg("dry-run");
  const services = activation.results.filter((item) => item.ok && item.active).slice(0, limit || undefined);

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await login(page, username, password);

  const results = [];
  for (const service of services) {
    try {
      const box = await getBox(page, service.box_id);
      const patches = findFinalFormPatches(box, service);
      box.meta = {
        ...(box.meta || {}),
        ep_final_submit_tracking: true,
        ep_final_submit_tracking_at: new Date().toISOString(),
        ep_final_submit_tracking_event: "convertbox.lead_submitted",
      };
      if (!dryRun && patches.length) await saveBox(page, box);
      results.push({
        box_id: service.box_id,
        service_slug: service.service_slug,
        service_label: service.service_label,
        patched_forms: patches.length,
        patches,
        status: patches.length ? (dryRun ? "dry_run" : "saved") : "no_final_form_found",
      });
      console.log(`${service.box_id} ${service.service_slug}: ${patches.length} final form(s) ${dryRun ? "would be patched" : "patched"}`);
    } catch (error) {
      results.push({
        box_id: service.box_id,
        service_slug: service.service_slug,
        service_label: service.service_label,
        patched_forms: 0,
        status: "failed",
        error: error.message,
      });
      console.error(`${service.box_id} ${service.service_slug}: ${error.message}`);
    }
  }

  await browser.close();

  const report = {
    applied_at: new Date().toISOString(),
    dry_run: dryRun,
    attempted: results.length,
    boxes_patched: results.filter((item) => item.status === "saved" || item.status === "dry_run").length,
    total_forms_patched: results.reduce((sum, item) => sum + item.patched_forms, 0),
    failed: results.filter((item) => item.status === "failed").length,
    results,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(
    OUT_MD,
    [
      "# Erie.Pro ConvertBox Submit Tracking",
      "",
      `Date: ${report.applied_at}`,
      `Mode: ${dryRun ? "dry run" : "applied"}`,
      "",
      `- Attempted boxes: ${report.attempted}`,
      `- Boxes patched: ${report.boxes_patched}`,
      `- Final forms patched: ${report.total_forms_patched}`,
      `- Failed: ${report.failed}`,
      "",
      "| Box | Service | Forms | Status |",
      "| --- | --- | ---: | --- |",
      ...results.map((item) => `| ${item.box_id} | ${item.service_label} | ${item.patched_forms} | ${item.status}${item.error ? `: ${item.error.replace(/\|/g, "/")}` : ""} |`),
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
