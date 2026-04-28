export function getOperatorAuthSecret() {
  const secret = process.env.LEAD_OS_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("LEAD_OS_AUTH_SECRET is required for operator authentication");
  }
  return secret;
}
