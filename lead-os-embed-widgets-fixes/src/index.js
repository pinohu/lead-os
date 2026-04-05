// src/index.js
const DEFAULTS = {
  runtimeBaseUrl: "",
  service: "lead-capture",
  niche: "general",
  mode: "chat",
  position: "bottom-right",
  theme: {},
};

const Z_DRAWER = "999998";
const Z_LAUNCHER = "999999";
const BOOT_CACHE_KEY = "lead-os-boot";
const BOOT_CACHE_TTL_MS = 5 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_MESSAGE_LEN = 2000;
const SUBMIT_COOLDOWN_MS = 3000;

function getConfig() {
  const config = { ...DEFAULTS, ...(window.LeadOSConfig || {}) };
  if (typeof Object.freeze === "function") Object.freeze(config);
  return config;
}

function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
      continue;
    }
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
      continue;
    }
    if (value != null) {
      element.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
      continue;
    }
    element.appendChild(child);
  }
  return element;
}

function validateEmail(value) {
  if (!value || typeof value !== "string") return "Email is required.";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Email is required.";
  if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
  if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
  return null;
}

function validateMessage(value) {
  if (!value || typeof value !== "string" || value.trim().length === 0) return "Message is required.";
  if (value.length > MAX_MESSAGE_LEN) return `Message must be under ${MAX_MESSAGE_LEN} characters.`;
  return null;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }
  return response.json();
}

function getCachedBoot() {
  try {
    const raw = sessionStorage.getItem(BOOT_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.ts > BOOT_CACHE_TTL_MS) {
      sessionStorage.removeItem(BOOT_CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedBoot(data) {
  try {
    sessionStorage.setItem(BOOT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* storage full or unavailable */
  }
}

async function fetchBootConfig(runtimeBaseUrl) {
  const cached = getCachedBoot();
  if (cached) return cached;

  const response = await fetch(`${runtimeBaseUrl}/api/widgets/boot`);
  if (!response.ok) {
    throw new Error(`Boot config fetch failed: ${response.status}`);
  }
  const data = await response.json();
  setCachedBoot(data);
  return data;
}

function safeWidget(bootConfig) {
  const widget = bootConfig && bootConfig.widget ? bootConfig.widget : {};
  return {
    brandName: widget.brandName || "Lead OS",
    accent: widget.accent || "#3b82f6",
  };
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container) {
  container.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

function buildDrawer(config, widget) {
  const drawer = createElement("div", {
    id: "lead-os-drawer",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": `${widget.brandName} Lead Assistant`,
    style: {
      position: "fixed",
      bottom: "92px",
      right: "24px",
      width: "360px",
      maxWidth: "calc(100vw - 48px)",
      background: "#08152c",
      color: "#f3f7fb",
      borderRadius: "18px",
      boxShadow: "0 18px 64px rgba(0, 0, 0, 0.35)",
      padding: "20px",
      zIndex: Z_DRAWER,
      display: "none",
      fontFamily: "Segoe UI, system-ui, sans-serif",
    },
  });

  const title = createElement("h3", { style: { marginTop: "0" } }, [
    `${widget.brandName} Lead Assistant`,
  ]);

  const description = createElement("p", { style: { color: "#bdd0ef" } }, [
    "Capture a lead, launch an assessment, or route a visitor to the best next step.",
  ]);

  const emailLabel = createElement("label", {
    for: "lead-os-email",
    style: { display: "block", marginBottom: "4px", fontSize: "13px", color: "#bdd0ef" },
  }, ["Email"]);

  const emailInput = createElement("input", {
    id: "lead-os-email",
    type: "email",
    placeholder: "you@example.com",
    maxlength: String(MAX_EMAIL_LEN),
    required: "true",
    "aria-required": "true",
    autocomplete: "email",
    style: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#102447",
      color: "#fff",
      marginBottom: "12px",
      boxSizing: "border-box",
    },
  });

  const messageLabel = createElement("label", {
    for: "lead-os-message",
    style: { display: "block", marginBottom: "4px", fontSize: "13px", color: "#bdd0ef" },
  }, ["Message"]);

  const messageInput = createElement("textarea", {
    id: "lead-os-message",
    placeholder: "What does the visitor need help with?",
    maxlength: String(MAX_MESSAGE_LEN),
    required: "true",
    "aria-required": "true",
    style: {
      width: "100%",
      minHeight: "90px",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#102447",
      color: "#fff",
      marginBottom: "12px",
      boxSizing: "border-box",
      resize: "vertical",
    },
  });

  const feedback = createElement("div", {
    "aria-live": "polite",
    role: "status",
    style: { minHeight: "24px", color: "#8de6d8", fontSize: "14px" },
  });

  let lastSubmitTime = 0;

  const submitButton = createElement(
    "button",
    {
      type: "button",
      style: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "0",
        background: widget.accent,
        color: "#08152c",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "15px",
      },
      onClick: async () => {
        const emailError = validateEmail(emailInput.value);
        if (emailError) {
          feedback.textContent = emailError;
          emailInput.focus();
          return;
        }
        const messageError = validateMessage(messageInput.value);
        if (messageError) {
          feedback.textContent = messageError;
          messageInput.focus();
          return;
        }

        const now = Date.now();
        if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
          feedback.textContent = "Please wait before submitting again.";
          return;
        }

        submitButton.disabled = true;
        feedback.textContent = "Submitting lead\u2026";

        try {
          const payload = {
            source: "embedded_widget",
            email: emailInput.value.trim(),
            message: messageInput.value.trim(),
            service: config.service,
            niche: config.niche,
            metadata: {
              origin: window.location.origin,
              pathname: window.location.pathname,
              title: document.title,
            },
          };

          const result = await postJson(`${config.runtimeBaseUrl}/api/intake`, payload);
          lastSubmitTime = Date.now();

          if (result.success) {
            feedback.textContent = "Lead captured successfully.";
            emailInput.value = "";
            messageInput.value = "";
          } else {
            feedback.textContent = "Lead submission failed. Please try again.";
          }
        } catch {
          feedback.textContent = "Lead submission failed. Please try again.";
        } finally {
          submitButton.disabled = false;
        }
      },
    },
    ["Submit Lead"],
  );

  const assessmentLink = createElement(
    "a",
    {
      href: `${config.runtimeBaseUrl}/assess/${config.niche}`,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        display: "inline-block",
        marginTop: "12px",
        color: "#8de6d8",
      },
    },
    ["Open Hosted Assessment"],
  );

  drawer.append(
    title, description,
    emailLabel, emailInput,
    messageLabel, messageInput,
    submitButton, feedback,
    assessmentLink,
  );

  trapFocus(drawer);

  return drawer;
}

function buildLauncher(accent) {
  return createElement(
    "button",
    {
      id: "lead-os-launcher",
      type: "button",
      style: {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "58px",
        height: "58px",
        borderRadius: "50%",
        border: "0",
        background: accent,
        color: "#07152c",
        fontWeight: "700",
        cursor: "pointer",
        zIndex: Z_LAUNCHER,
        fontSize: "16px",
      },
      "aria-label": "Open Lead OS widget",
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
    },
    ["LO"],
  );
}

function toggleDrawer(drawer, launcher) {
  const isOpen = drawer.style.display !== "none";
  drawer.style.display = isOpen ? "none" : "block";
  launcher.setAttribute("aria-expanded", String(!isOpen));

  if (!isOpen) {
    const firstInput = drawer.querySelector("input, textarea");
    if (firstInput) firstInput.focus();
  }
}

export async function mountLeadOS() {
  const config = getConfig();
  if (!config.runtimeBaseUrl) {
    console.warn("[Lead OS] runtimeBaseUrl is not configured.");
    return;
  }

  let bootConfig;
  try {
    bootConfig = await fetchBootConfig(config.runtimeBaseUrl);
  } catch (err) {
    console.warn("[Lead OS] Failed to load boot config:", err.message);
    bootConfig = {};
  }

  const widget = safeWidget(bootConfig);
  const launcher = buildLauncher(widget.accent);
  let drawer = null;

  launcher.addEventListener("click", () => {
    if (!drawer) {
      drawer = buildDrawer(config, widget);
      document.body.appendChild(drawer);

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.style.display !== "none") {
          toggleDrawer(drawer, launcher);
          launcher.focus();
        }
      });

      document.addEventListener("click", (e) => {
        if (
          drawer.style.display !== "none" &&
          !drawer.contains(e.target) &&
          !launcher.contains(e.target)
        ) {
          toggleDrawer(drawer, launcher);
        }
      });
    }
    toggleDrawer(drawer, launcher);
  });

  document.body.appendChild(launcher);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountLeadOS().catch((err) => {
        console.warn("[Lead OS] Widget initialization failed:", err.message);
      });
    });
  } else {
    mountLeadOS().catch((err) => {
      console.warn("[Lead OS] Widget initialization failed:", err.message);
    });
  }
}
