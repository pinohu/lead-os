export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const required: Record<string, string | undefined> = {
      LEAD_OS_AUTH_SECRET: process.env.LEAD_OS_AUTH_SECRET ?? process.env.CRON_SECRET,
    };

    const recommended: Record<string, string | undefined> = {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    };

    const missingRequired = Object.entries(required)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingRequired.length > 0) {
      console.error(`[Lead OS] FATAL: Missing required environment variables: ${missingRequired.join(", ")}`);
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
    }

    const missingRecommended = Object.entries(recommended)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingRecommended.length > 0) {
      console.warn(`[Lead OS] WARNING: Missing recommended environment variables: ${missingRecommended.join(", ")}. Some features may not work correctly.`);
    }
  }
}
