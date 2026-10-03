import type { NextConfig } from 'next'

/** The Enable accessibility menu: its script's origin, and the vendor's hosts for its assets. */
const ENABLE_SCRIPT_ORIGIN = 'https://cdn.enable.co.il'
const ENABLE_ORIGINS = 'https://enable.co.il https://*.enable.co.il'

/**
 * Response headers for every path. `production` is the Vercel production deployment, the
 * only one served from the canonical https origin and the only one search engines may index.
 * Rationale and what is deliberately deferred: docs/ARCHITECTURE.md, "Security headers".
 */
export function securityHeaders(production: boolean) {
  const csp = [
    "default-src 'self'",
    // 'unsafe-inline': Next's App Router streams each page's data as inline scripts and
    // the motion head script runs before paint. Nonces would force every page to render
    // per request (no static generation); per-page hashes would need build-generated,
    // per-route headers. The Enable menu (src/components/a11y/EnableWidget.tsx) loads its
    // script from cdn.enable.co.il. No 'unsafe-eval'.
    `script-src 'self' 'unsafe-inline' ${ENABLE_SCRIPT_ORIGIN}`,
    // 'unsafe-inline': React style attributes (grid placements, aspect ratios) and the
    // styles the Enable menu injects.
    `style-src 'self' 'unsafe-inline' ${ENABLE_ORIGINS}`,
    `img-src 'self' data: blob: ${ENABLE_ORIGINS}`,
    "media-src 'self'",
    `font-src 'self' data: ${ENABLE_ORIGINS}`,
    `connect-src 'self' ${ENABLE_ORIGINS}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Production is https only; on http://localhost this would break local and CI runs.
    ...(production ? ['upgrade-insecure-requests'] : []),
  ].join('; ')

  return [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Legacy equivalent of frame-ancestors 'none', for browsers without CSP Level 2.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
    ...(production
      ? [
          // Two years, subdomains included. The .dev top-level domain is already on the
          // browsers' HSTS preload list, so every martin-g.dev host is https only anyway;
          // no `preload` directive, since there is nothing to submit.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ]
      : // Only the production deployment may be indexed (isIndexable in src/lib/site.ts,
        // which robots.ts follows too); previews, local and CI builds tell crawlers not to.
        [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
  ]
}

const nextConfig: NextConfig = {
  // Security requirement: never ship browser source maps to production.
  // Enforced by scripts/lint-policy.mjs, which fails if this line changes.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // `next dev` would otherwise append generated agent rules to CLAUDE.md (a public file
  // with its own reviewed working rules).
  agentRules: false,
  typedRoutes: true,
  images: {
    // Real photography and product screens ship as WebP, never as the sources. AVIF was
    // measured at 5 to 10 times the encode time per image (seconds per photograph), which
    // every fresh deployment's first visitors would wait for; WebP encodes in well under a
    // second for a moderate size cost.
    formats: ['image/webp'],
  },
  experimental: {
    // The root layout lives under [locale]; this handles URLs outside it.
    globalNotFound: true,
  },
  async headers() {
    const production = process.env.VERCEL_ENV === 'production'
    return [{ source: '/:path*', headers: securityHeaders(production) }]
  },
}

export default nextConfig
