/**
 * Structured logger for Lead OS.
 * - Production: JSON lines (machine-parseable)
 * - Development: human-readable with ANSI colors
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",  // gray
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
};
const RESET = "\x1b[0m";

const isProduction = process.env.NODE_ENV === "production";

function formatDev(level: LogLevel, message: string, context?: LogContext): string {
  const time = new Date().toISOString().slice(11, 23);
  const color = LEVEL_COLORS[level];
  const tag = `${color}${level.toUpperCase().padEnd(5)}${RESET}`;
  const ctx = context && Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : "";
  return `${time} ${tag} ${message}${ctx}`;
}

function formatJson(level: LogLevel, message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const line = isProduction
    ? formatJson(level, message, context)
    : formatDev(level, message, context);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

export type Logger = typeof logger;
