import { NextResponse, type NextRequest } from 'next/server'
import { adminAuthConfig } from './config'
import { checkAdmin, createAuthClient, endSession, type CookieToSet } from './session'

/*
 * The proxy's admin branch (src/proxy.ts). Admin routes are unlocalized and never
 * redirected into /he or /en. Here, and only here, the Supabase session is refreshed: a
 * Server Component cannot write cookies, so refreshed tokens are written on the way in.
 * It also sends anyone who is not the admin to /admin/login before a page renders. This is
 * defense in depth, never the boundary: every page and action calls requireAdmin() itself.
 * Public routes never reach this code, so they stay statically generated.
 */

export const ADMIN_PREFIX = '/admin'
const LOGIN = '/admin/login'

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)
}

/** Private: never indexed, never cached, no referrer to a lead's website. */
export function withPrivateHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

export async function adminProxy(request: NextRequest): Promise<NextResponse> {
  const isLogin = request.nextUrl.pathname === LOGIN
  // Only page loads are redirected. A Server Action's POST reaches its action, which
  // answers with requireAdmin()'s own redirect, the protocol Next expects.
  const navigates = request.method === 'GET' || request.method === 'HEAD'
  const config = adminAuthConfig()

  let response = NextResponse.next({ request })
  let allowed = false
  if (config) {
    const written: CookieToSet[] = []
    const client = createAuthClient(config, {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value } of cookies) request.cookies.set(name, value)
        written.push(...cookies)
        response = NextResponse.next({ request })
        for (const { name, value, options } of written) response.cookies.set(name, value, options)
      },
    })
    const check = await checkAdmin(client, config.adminUserId)
    if (check.status === 'forbidden') await endSession(client)
    allowed = check.status === 'admin'
  }

  if (!allowed && !isLogin && navigates) {
    const redirect = NextResponse.redirect(new URL(LOGIN, request.url), 307)
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return withPrivateHeaders(redirect)
  }
  return withPrivateHeaders(response)
}
