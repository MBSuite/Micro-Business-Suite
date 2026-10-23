// Next.js server instrumentation — runs once at server startup.
// Fails fast if required environment variables are missing (P2-02).
export async function register() {
  const { validateEnv } = await import("@/lib/env");
  validateEnv();

  // License lock: both delivery models (perpetual & subscription) require a
  // valid offline-signed MBS_LICENSE_KEY. Fail fast on invalid/expired keys.
  // Skipped during `next build` (phase-production-build) — only enforced at runtime.
  // License verification uses node:crypto and must run only in the Node runtime.
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PHASE &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { requireActiveLicense } = await import("@/lib/license");
    requireActiveLicense();
  }

  // Cron maintenance uses node:child_process and must only run in the Node runtime.
  // Guarding here keeps it out of the Edge instrumentation bundle.
  if (process.env.CRON_ENABLED === "true" && process.env.NEXT_RUNTIME === "nodejs") {
    const { registerMaintenance } = await import("@/jobs/scheduleMaintenance");
    registerMaintenance();
  }
}