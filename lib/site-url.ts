// Canonical base URL used when building links that get sent outside the
// current request (e.g. password reset emails). Prefer an explicit
// NEXT_PUBLIC_SITE_URL (set it in your deployment's environment variables) so
// the value is stable regardless of which domain/preview served the request;
// fall back to the browser's current origin when it isn't set.
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
