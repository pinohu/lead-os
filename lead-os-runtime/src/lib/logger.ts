type LogData = Record<string, unknown>

export function log(event: string, data: LogData = {}): void {
  console.log(
    JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }),
  )
}

export const logger = {
  debug(message: string, context: LogData = {}): void {
    log(message, { level: "debug", ...context })
  },
  info(message: string, context: LogData = {}): void {
    log(message, { level: "info", ...context })
  },
  warn(message: string, context: LogData = {}): void {
    log(message, { level: "warn", ...context })
  },
  error(message: string, context: LogData = {}): void {
    log(message, { level: "error", ...context })
  },
}

export type Logger = typeof logger
