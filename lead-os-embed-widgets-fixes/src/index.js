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
const FETCH_TIMEOUT_MS = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,8})$/;
const MAX_EMAIL_LEN = 254;
const MAX_MESSAGE_LEN = 2000;
const SUBMIT_COOLDOWN_MS = 3000;
const SUCCESS_DISMISS_MS = 5000;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let instanceCounter = 0;

function uid(base) {
  return `${base}-${++instanceCounter}`;
}

export function getConfig() {
  const config = { ...DEFAULTS, ...(window.LeadOSConfig || {}) };
  if (typeof Object.freeze === "function") Object.freeze(config);
  return config;
}

export function createElement(tag, attrs = {}, children = []) {
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

export function validateEmail(value) {
  if (!value || typeof value !== "string") return "Email is required.";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Email is required.";
  if (trimmed.length > MAX_EMAIL_LEN) return "Email is too long.";
  if (!EMAIL_RE.test(trimmed)) return "Please enter a valid email address.";
  return null;
}

export function validateMessage(value) {
  if (!value || typeof value !== "string" || value.trim().length === 0) return "Message is required.";
  if (value.length > MAX_MESSAGE_LEN) return `Message must be under ${MAX_MESSAGE_LEN} characters.`;
  return null;
}

export function safeAccent(raw) {
  if (typeof raw === "string" && HEX_COLOR_RE.test(raw)) return raw;
  return "#3b82f6";
}

export function safeWidget(bootConfig) {
  const widget = bootConfig && bootConfig.widget ? bootConfig.widget : {};
  return {
    brandName: (typeof widget.brandName === "string" && widget.brandName.length > 0) ? widget.brandName : "Lead OS",
    accent: safeAccent(widget.accent),
  };
}

function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function postJson(url, payload) {
  const response = await fetchWithTimeout(url, {
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

  const response = await fetchWithTimeout(`${runtimeBaseUrl}/api/widgets/boot`);
  if (!response.ok) {
    throw new Error(`Boot config fetch failed: ${response.status}`);
  }
  const data = await response.json();
  setCachedBoot(data);
  return data;
}

function injectWidgetStyles() {
  if (document.getElementById("lead-os-embed-styles")) return;
  const style = document.createElement("style");
  style.id = "lead-os-embed-styles";
  style.textContent = `
    #lead-os-drawer *:focus-visible,
    .lead-os-launcher:focus-visible {
      outline: 2px solid #8de6d8;
      outline-offset: 2px;
    }
    #lead-os-drawer input::placeholder,
    #lead-os-drawer textarea::placeholder {
      color: #8ba3c7;
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

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
  const emailId = uid("lead-os-email");
  const messageId = uid("lead-os-message");
  const feedbackId = uid("lead-os-feedback");

  const drawer = createElement("div", {
    id: "lead-os-drawer",
    role: "dialog",
    "aria-label": `${widget.brandName} Lead Assistant`,
    style: {
      position: "fixed",
      bottom: "92px",
      right: "24px",
      width: "360px",
      maxWidth: "calc(100vw - 48px)",
      maxHeight: "calc(100vh - 120px)",
      overflowY: "auto",
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

  const header = createElement("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  });

  const title = createElement("h2", { style: { marginTop: "0", marginBottom: "8px", fontSize: "18px" } }, [
    `${widget.brandName} Lead Assistant`,
  ]);

  const closeButton = createElement(
    "button",
    {
      type: "button",
      "aria-label": "Close widget",
      style: {
        background: "transparent",
        border: "0",
        color: "#bdd0ef",
        cursor: "pointer",
        fontSize: "20px",
        padding: "4px 8px",
        lineHeight: "1",
        flexShrink: "0",
      },
    },
    ["\u00D7"],
  );

  header.append(title, closeButton);

  const description = createElement("p", { style: { color: "#bdd0ef", marginTop: "0" } }, [
    "Capture a lead, launch an assessment, or route a visitor to the best next step.",
  ]);

  const emailLabel = createElement("label", {
    for: emailId,
    style: { display: "block", marginBottom: "4px", fontSize: "13px", color: "#bdd0ef" },
  }, ["Email"]);

  const emailInput = createElement("input", {
    id: emailId,
    type: "email",
    placeholder: "you@example.com",
    maxlength: String(MAX_EMAIL_LEN),
    required: "true",
    "aria-required": "true",
    "aria-describedby": feedbackId,
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
    for: messageId,
    style: { display: "block", marginBottom: "4px", fontSize: "13px", color: "#bdd0ef" },
  }, ["Message"]);

  const messageInput = createElement("textarea", {
    id: messageId,
    placeholder: "What does the visitor need help with?",
    maxlength: String(MAX_MESSAGE_LEN),
    required: "true",
    "aria-required": "true",
    "aria-describedby": feedbackId,
    autocomplete: "off",
    style: {
      width: "100%",
      minHeight: "90px",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#102447",
      color: "#fff",
      marginBottom: "4px",
      boxSizing: "border-box",
      resize: "vertical",
    },
  });

  const charCounter = createElement("div", {
    "aria-hidden": "true",
    style: { textAlign: "right", fontSize: "12px", color: "#667a99", marginBottom: "12px" },
  }, [`0 / ${MAX_MESSAGE_LEN}`]);

  messageInput.addEventListener("input", () => {
    const len = messageInput.value.length;
    charCounter.textContent = `${len} / ${MAX_MESSAGE_LEN}`;
    charCounter.style.color = len > MAX_MESSAGE_LEN * 0.9 ? "#f87171" : "#667a99";
  });

  const feedback = createElement("div", {
    id: feedbackId,
    "aria-live": "polite",
    role: "status",
    style: { minHeight: "24px", color: "#8de6d8", fontSize: "14px" },
  });

  let lastSubmitTime = 0;
  let dismissTimer = null;

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
        if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }

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
            charCounter.textContent = `0 / ${MAX_MESSAGE_LEN}`;
            dismissTimer = setTimeout(() => { feedback.textContent = ""; }, SUCCESS_DISMISS_MS);
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
    header, description,
    emailLabel, emailInput,
    messageLabel, messageInput, charCounter,
    submitButton, feedback,
    assessmentLink,
  );

  trapFocus(drawer);

  closeButton.addEventListener("click", () => {
    drawer._onClose();
  });

  return drawer;
}

function buildLauncher(accent) {
  return createElement(
    "button",
    {
      type: "button",
      class: "lead-os-launcher",
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
      title: "Open Lead OS widget",
    },
    ["LO"],
  );
}

function openDrawer(drawer, launcher) {
  drawer.style.display = "block";
  launcher.setAttribute("aria-expanded", "true");
  const firstInput = drawer.querySelector("input, textarea");
  if (firstInput) firstInput.focus();
}

function closeDrawer(drawer, launcher) {
  drawer.style.display = "none";
  launcher.setAttribute("aria-expanded", "false");
}

function toggleDrawer(drawer, launcher) {
  if (drawer.style.display !== "none") {
    closeDrawer(drawer, launcher);
  } else {
    openDrawer(drawer, launcher);
  }
}

export async function mountLeadOS() {
  const config = getConfig();
  if (!config.runtimeBaseUrl) {
    console.warn("[Lead OS] runtimeBaseUrl is not configured.");
    return;
  }

  injectWidgetStyles();

  const defaultWidget = safeWidget({});
  const launcher = buildLauncher(defaultWidget.accent);
  document.body.appendChild(launcher);

  let drawer = null;
  let outsideClickBound = false;

  function handleClose() {
    if (drawer) {
      closeDrawer(drawer, launcher);
      launcher.focus();
    }
  }

  fetchBootConfig(config.runtimeBaseUrl)
    .then((bootConfig) => {
      const widget = safeWidget(bootConfig);
      launcher.style.background = widget.accent;
      launcher._widget = widget;
    })
    .catch((err) => {
      console.warn("[Lead OS] Failed to load boot config:", err.message);
      launcher._widget = defaultWidget;
    });

  launcher.addEventListener("click", (e) => {
    e.stopPropagation();

    const widget = launcher._widget || defaultWidget;

    if (!drawer) {
      drawer = buildDrawer(config, widget);
      drawer._onClose = handleClose;
      document.body.appendChild(drawer);

      document.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && drawer.style.display !== "none") {
          handleClose();
        }
      });
    }

    toggleDrawer(drawer, launcher);

    if (!outsideClickBound) {
      outsideClickBound = true;
      setTimeout(() => {
        document.addEventListener("click", (evt) => {
          if (
            drawer &&
            drawer.style.display !== "none" &&
            !drawer.contains(evt.target) &&
            !launcher.contains(evt.target)
          ) {
            closeDrawer(drawer, launcher);
          }
        });
      }, 0);
    }
  });
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
