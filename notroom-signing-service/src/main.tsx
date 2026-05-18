import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { assertClientEnv } from "./utils/envValidation";
import { logger } from "./utils/logger";

// Validate environment variables at startup
try {
  assertClientEnv();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Environment validation failed:', errorMessage);
  
  // Show user-friendly error in production
  if (!import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif; max-width: 600px; margin: 2rem auto;">
        <h1 style="color: #dc2626;">Configuration Error</h1>
        <p style="color: #6b7280; margin: 1rem 0;">The application is not properly configured.</p>
        <p style="color: #6b7280;">Please contact support if this issue persists.</p>
      </div>
    `;
  }
  throw error;
}

// Initialize app first
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize PWA and Web Vitals after app loads (non-blocking)
try {
  // Dynamic imports to avoid blocking app initialization
  Promise.all([
    import("./utils/pwa").then((module) => module.registerServiceWorker()),
    import("./utils/webVitals").then((module) => module.initWebVitals()),
  ]).catch((error) => {
    logger.warn("Failed to initialize PWA/Web Vitals:", error);
  });
} catch (error) {
  logger.warn("Failed to load PWA/Web Vitals modules:", error);
}
