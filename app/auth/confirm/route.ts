import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Verifies a Supabase recovery/signup/magic-link token_hash server-side and
// establishes the session via cookies before redirecting.
//
// This intentionally does NOT rely on the PKCE `code` exchange the browser
// client would otherwise auto-detect from the URL: that mechanism requires
// the code_verifier stored in the browser that originally requested the
// email to still be present when the link is opened, which breaks whenever
// the link is opened in a different browser/app than the one that requested
// it (e.g. an email app's in-app browser vs. the user's regular browser,
// or a different device entirely) — the very common real-world case for
// password recovery. token_hash verification has no such requirement: it
// works from any device/browser.
//
// Requires the Supabase "Reset Password" email template to link here, e.g.:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/reset-password'

  // `next` may be an absolute URL (from {{ .RedirectTo }}) or a relative
  // path. Only ever redirect within this origin to avoid an open redirect.
  let nextPath = '/reset-password'
  try {
    const nextUrl = new URL(nextParam, origin)
    if (nextUrl.origin === origin) nextPath = `${nextUrl.pathname}${nextUrl.search}`
  } catch {
    // keep default
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${nextPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/reset-password?error=invalid_or_expired`)
}
