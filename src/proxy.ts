import { NextResponse, type NextRequest } from 'next/server'
import { localeCookie, localeHeader } from '@/i18n/config'
import { localeFromPathname, negotiateLocale } from '@/i18n/negotiate'
import { adminProxy, isAdminPath } from '@/lib/admin/proxy'

/**
 * Only unprefixed URLs reach this logic: a server-side redirect sends them to the
 * visitor's chosen locale, or to Hebrew by default, before anything renders. Prefixed URLs
 * pass through, so every page stays statically generated and no redirect loops; they only
 * carry their locale to the server (`localeHeader`), which the 404 page reads.
 *
 * The private admin (/admin, unlocalized) is the one deliberate exception: it is never
 * redirected into a locale, and its branch (src/lib/admin/proxy.ts) is the only place
 * that reads or refreshes a session. Public requests never touch it.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isAdminPath(pathname)) return adminProxy(request)
  const prefixed = localeFromPathname(pathname)
  if (prefixed) {
    const headers = new Headers(request.headers)
    headers.set(localeHeader, prefixed)
    return NextResponse.next({ request: { headers } })
  }

  const locale = negotiateLocale({ cookie: request.cookies.get(localeCookie)?.value })
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  url.search = search
  // Temporary, and varying by cookie: the target depends on the visitor's choice.
  const response = NextResponse.redirect(url, 307)
  response.headers.set('Vary', 'Cookie')
  return response
}

export const config = {
  // Skip Next internals, metadata files and anything with a file extension.
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
