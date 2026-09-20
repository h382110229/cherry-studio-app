// no-op stub — Sentry fully disabled for Hawk AI Assistant
// Preserves all export signatures to avoid breaking import chains

export const SENTRY_CONSENT_VERSION = '20260915';

type SentryConsentStatus = { enabled: boolean; active: boolean; available: boolean };

const status: SentryConsentStatus = { enabled: false, active: false, available: false };
const listeners = new Set<() => void>();

export function getSentryConsentStatus(): SentryConsentStatus {
  return status;
}

export function subscribeSentryConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function setSentryConsent(_enabled: boolean): Promise<void> {
  // no-op — Sentry is disabled in Hawk AI Assistant
}

export function configureSentry(): Promise<void> {
  return Promise.resolve();
}