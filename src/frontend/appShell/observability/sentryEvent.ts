// no-op stub — Sentry event helpers disabled for Hawk AI Assistant
// Pure functions preserved for import compatibility; all return safe defaults.

export function isExpectedSentryError(_error: unknown): boolean {
  return true;
}

export function sentryIdentifier(_value: unknown): string | undefined {
  return undefined;
}

export function sanitizeSentryEvent(_event: unknown): null {
  return null;
}