import { NextResponse, type NextRequest } from 'next/server'
import { localeCookie } from '@/i18n/config'
import { localeFromPathname, negotiateLocale } from '@/i18n/negotiate'

/**
 * Only unprefixed URLs reach this logic: a server-side redirect sends them to the
 * visitor's chosen locale, or to Hebrew by default, before anything renders. Prefixed URLs
 * pass through untouched, so every page stays statically generated and no redirect loops.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (localeFromPathname(pathname)) return NextResponse.next()

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
