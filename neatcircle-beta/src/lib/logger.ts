const isDev = process.env.NODE_ENV === "development";

interface LogContext {
  [key: string]: unknown;
}

function log(level: "debug" | "info" | "warn" | "error", message: string, context?: LogContext): void {
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (isDev) {
    fn(`[${level.toUpperCase()}] ${message}`, context ?? "");
  } else {
    fn(JSON.stringify({ level, message, ...(context ?? {}), ts: Date.now() }));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
