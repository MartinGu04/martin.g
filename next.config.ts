import type { NextConfig } from 'next'

/** The Enable accessibility menu: its script's origin, and the vendor's hosts for its assets. */
const ENABLE_SCRIPT_ORIGIN = 'https://cdn.enable.co.il'
const ENABLE_ORIGINS = 'https://enable.co.il https://*.enable.co.il'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    // Static CSP (no nonces) so every page stays statically generated.
    // 'unsafe-inline' for scripts is required by Next's inline bootstrap without nonces.
    // The Enable accessibility menu (src/components/a11y/EnableWidget.tsx) loads its script
    // from cdn.enable.co.il and its assets and requests from enable.co.il hosts.
    // Launch hardening: review after Analytics (docs/ARCHITECTURE.md).
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${ENABLE_SCRIPT_ORIGIN}`,
      `style-src 'self' 'unsafe-inline' ${ENABLE_ORIGINS}`,
      `img-src 'self' data: blob: ${ENABLE_ORIGINS}`,
      "media-src 'self'",
      `font-src 'self' data: ${ENABLE_ORIGINS}`,
      `connect-src 'self' ${ENABLE_ORIGINS}`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
]

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
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
