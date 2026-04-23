export interface ApprovedEnvMap {
  suitedash: Record<string, string>
  stripe: Record<string, string>
  email: Record<string, string>
}

function filterByPrefix(prefix: string): Record<string, string> {
  return Object.entries(process.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (!key.startsWith(prefix) || !value) return acc
      acc[key] = value
      return acc
    },
    {},
  )
}

export function getApprovedEnvMap(): ApprovedEnvMap {
  return {
    suitedash: filterByPrefix("SUITEDASH_"),
    stripe: filterByPrefix("STRIPE_"),
    email: filterByPrefix("EMAIL_"),
  }
}
