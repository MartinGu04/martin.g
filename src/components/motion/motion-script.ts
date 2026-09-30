/**
 * Inline head script (runs before first paint). It marks that JavaScript is available so
 * reveal elements may start hidden, and falls back to fully visible content if the motion
 * controller has not taken over in time (slow network, hydration error, blocked script).
 * Allowed by the static CSP ('unsafe-inline' for scripts, see next.config.ts).
 */
export const MOTION_FALLBACK_MS = 2500

export const motionHeadScript = `(function(){var d=document.documentElement;d.setAttribute('data-motion','pending');setTimeout(function(){if(d.getAttribute('data-motion')==='pending')d.setAttribute('data-motion','off')},${MOTION_FALLBACK_MS})})();`
