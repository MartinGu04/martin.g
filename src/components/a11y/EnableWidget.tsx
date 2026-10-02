import Script from 'next/script'

/**
 * The Enable accessibility menu, supplied and approved by Martin: this exact licensed
 * script, unchanged. It is an additional tool, never a substitute for the site's own
 * accessibility (semantic HTML, keyboard support, focus, reduced motion, contrast, reflow),
 * which works with or without it.
 *
 * Loaded once per document from the root layout (both locales share it), through
 * next/script with `lazyOnload`: it is fetched after the page has loaded and the browser is
 * idle, so it never blocks rendering or competes with hydration, and the server-rendered
 * HTML is identical with or without it. Client-side navigations keep the one instance.
 * The Content Security Policy allows its origin (next.config.ts). Without JavaScript it
 * does not load, and nothing depends on it.
 *
 * Third party: the visitor's browser connects to cdn.enable.co.il (documented on the
 * Privacy and Accessibility pages).
 */
export const ENABLE_SCRIPT_SRC =
  'https://cdn.enable.co.il/licenses/enable-L56389fiq4mpysr4-0926-83906/init.js'

export function EnableWidget() {
  return <Script id="enable-accessibility" src={ENABLE_SCRIPT_SRC} strategy="lazyOnload" />
}
