import type { MetadataRoute } from 'next'

/**
 * Web app manifest: how MARTIN.G appears when saved to a home screen (Android and other
 * PWA surfaces; iOS reads apple-icon.png). Icons come from scripts/brand-icons.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MARTIN.G',
    short_name: 'MARTIN.G',
    start_url: '/',
    display: 'standalone',
    background_color: '#060606',
    theme_color: '#060606',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
