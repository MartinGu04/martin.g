import { NextResponse, type NextRequest } from 'next/server'
import { localeCookie } from '@/i18n/config'
import { localeFromPathname, negotiateLocale } from '@/i18n/negotiate'

/**
 * Only unprefixed URLs reach this logic: they are redirected to the negotiated locale.
 * Prefixed URLs pass through untouched, so every page stays statically generated.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (localeFromPathname(pathname)) return NextResponse.next()

  const locale = negotiateLocale({
    cookie: request.cookies.get(localeCookie)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  })
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  url.search = search
  const response = NextResponse.redirect(url, 307)
  response.headers.set('Vary', 'Accept-Language, Cookie')
  return response
}

export const config = {
  // Skip Next internals, metadata files and anything with a file extension.
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
