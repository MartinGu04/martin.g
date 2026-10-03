import 'server-only'

/*
 * Publishing the editor's saved copy (Phase 8C). The public pages are generated at build
 * time, so saved copy reaches visitors through a new Production build, where the leak
 * check and the release gate run on it. The admin starts one with a Vercel Deploy Hook:
 *
 *   VERCEL_DEPLOY_HOOK_URL   the project's Deploy Hook for the production branch,
 *                            https://api.vercel.com/v1/integrations/deploy/...
 *
 * The URL is a secret (anyone holding it can start a build): a server-side variable,
 * never NEXT_PUBLIC_, never logged or rendered. Optional: without it, saved copy reaches
 * the site with the next deployment.
 */

type Env = Record<string, string | undefined>

export const DEPLOY_HOOK_HOST = 'api.vercel.com'

/** The configured hook, only if it is Vercel's (or a local test server's). */
export function deployHookUrl(env: Env = process.env): URL | null {
  const value = env.VERCEL_DEPLOY_HOOK_URL?.trim()
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.username || url.password || url.hash) return null
  const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
  if (url.protocol === 'https:' && url.hostname === DEPLOY_HOOK_HOST) return url
  if (url.protocol === 'http:' && local && env.VERCEL !== '1') return url
  return null
}

export type PublishResult = 'started' | 'unavailable' | 'failed'

/** Starts a Production build. Never throws; the answer carries no detail of the hook. */
export async function triggerDeploy(env: Env = process.env): Promise<PublishResult> {
  const url = deployHookUrl(env)
  if (!url) return 'unavailable'
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    })
    return response.ok ? 'started' : 'failed'
  } catch {
    return 'failed'
  }
}
