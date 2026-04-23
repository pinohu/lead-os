export type AutonomyMode = "shadow" | "active"

export function isAutonomyEnabled(): boolean {
  return process.env.AUTONOMY_ENABLED === "true"
}

export function resolveAutonomyMode(): AutonomyMode {
  return process.env.AUTONOMY_MODE === "active" ? "active" : "shadow"
}

export function isAgentKillSwitchEnabled(): boolean {
  return process.env.AGENT_KILL_SWITCH === "true"
}
