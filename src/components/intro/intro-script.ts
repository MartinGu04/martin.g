/**
 * The brand intro: the MARTIN.G brand film, once per browser session, over the homepage
 * that is already rendering beneath it. docs/ARCHITECTURE.md, "Brand intro".
 *
 * One inline script, the first thing in <body>, decides and runs it before the page below
 * has painted, so the intro never flashes in after the hero and never waits for hydration.
 * It builds its own layer (a modal <dialog> outside React's tree: React 19 skips foreign
 * elements in <body> while hydrating) and removes it completely afterwards. Allowed by the
 * static CSP ('unsafe-inline' for scripts, media from 'self'; see next.config.ts).
 *
 * The page is never held hostage: every way out (the film ends, Skip, Escape, an error,
 * a refused autoplay, no first frame within INTRO_START_TIMEOUT_MS, a picture frozen for
 * INTRO_STALL_MS, reduced motion switched on) lifts the layer onto the page.
 */

/** sessionStorage key: set on the first page load of a session, whatever that page is. */
export const INTRO_SESSION_KEY = 'mg:intro'

/** Wide screens get the 16:9 edit, portrait screens the dedicated 9:16 edit. */
export const INTRO_PORTRAIT_QUERY = '(orientation: portrait)'

/** Without a first frame by then, the visitor gets the site instead of a black screen. */
export const INTRO_START_TIMEOUT_MS = 2500

/** A picture that stops advancing this long (while the tab is visible) ends the intro. */
export const INTRO_STALL_MS = 4000

/** Longest exit fade (--dur-cinematic) plus slack: the layer is removed by then at the latest. */
const REMOVE_AFTER_MS = 1400

export interface IntroFilm {
  src: string
  /** Asked of canPlayType first: a browser that cannot decode it never sees the layer. */
  type: string
  /** Seconds: the film cuts to black after MAKE IT REAL.; the site rises out of that black. */
  handoff: number
}

/**
 * The approved final cuts (film/README.md), video stream only: the picture is the approved
 * render bit for bit; the soundtrack, which the intro never plays, is not shipped.
 */
export const INTRO_FILMS: Record<'landscape' | 'portrait', IntroFilm> = {
  landscape: {
    src: '/media/brand-film/martin-g-film-desktop.mp4',
    type: 'video/mp4; codecs="avc1.640032"',
    handoff: 43,
  },
  portrait: {
    src: '/media/brand-film/martin-g-film-mobile.mp4',
    type: 'video/mp4; codecs="avc1.640032"',
    handoff: 34,
  },
}

export interface IntroScriptConfig {
  /** The locale's homepage path, the only page the intro plays on. */
  home: string
  /** The dialog's accessible name. */
  name: string
  skip: string
  classes: { intro: string; film: string; skip: string }
}

/*
 * The runtime. Plain ES2017, written for the browser as is (it is never transpiled).
 * After showModal() the layer itself takes focus, not Skip, so Skip shows no focus ring on
 * arrival; Tab reaches it.
 */
const runtime = `function (c) {
  var d = document, root = d.documentElement
  try {
    var seen = sessionStorage.getItem(c.key)
    sessionStorage.setItem(c.key, 'seen')
    if (seen) return
  } catch (e) {
    return
  }
  if (location.pathname.replace(/\\/+$/, '') !== c.home || location.hash) return
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches) return
  if (d.visibilityState === 'hidden' || typeof HTMLDialogElement !== 'function') return
  var net = navigator.connection
  if (net && (net.saveData || /2g$/.test(net.effectiveType || ''))) return
  var shape = matchMedia(c.portrait).matches ? 'portrait' : 'landscape'
  var film = c.films[shape]
  var video = d.createElement('video')
  if (!video.canPlayType(film.type)) return

  var dialog = d.createElement('dialog')
  var skip = d.createElement('button')
  dialog.className = c.classes.intro
  dialog.setAttribute('data-film', shape)
  dialog.setAttribute('aria-label', c.name)
  dialog.tabIndex = -1
  video.className = c.classes.film
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.preload = 'auto'
  ;['muted', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(
    function (a) { video.setAttribute(a, '') },
  )
  video.setAttribute('aria-hidden', 'true')
  skip.type = 'button'
  skip.className = c.classes.skip
  skip.textContent = c.skip
  dialog.append(video, skip)
  d.body.insertBefore(dialog, d.body.firstChild)
  try {
    dialog.showModal()
    dialog.focus()
  } catch (e) {
    dialog.remove()
    return
  }
  root.setAttribute('data-intro', 'on')

  var state = 'on', started = false, last = -1, still = 0
  var reduce = matchMedia('(prefers-reduced-motion: reduce)')
  var scrollKeys = /^( |Spacebar|PageUp|PageDown|Home|End|Arrow(Up|Down|Left|Right))$/
  var stop = function (e) { e.preventDefault() }
  var onKey = function (e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      lift('skip')
    } else if (scrollKeys.test(e.key) && !(e.target === skip && e.key === ' ')) {
      e.preventDefault()
    }
  }
  var onReduce = function () { if (reduce.matches) lift('skip') }
  var startTimer = setTimeout(function () { if (!started) lift('fail') }, c.startMs)
  var watch = setInterval(function () {
    if (!started || d.visibilityState === 'hidden') return
    if (video.currentTime !== last) {
      last = video.currentTime
      still = 0
    } else if ((still += 1000) >= c.stallMs) {
      lift('fail')
    }
  }, 1000)

  function lift(how) {
    if (state !== 'on') return
    state = 'out'
    clearTimeout(startTimer)
    clearInterval(watch)
    d.removeEventListener('keydown', onKey, true)
    reduce.removeEventListener('change', onReduce)
    dialog.setAttribute('data-exit', how)
    root.setAttribute('data-intro', 'out')
    dialog.addEventListener('transitionend', function (e) { if (e.target === dialog) remove() })
    setTimeout(remove, c.removeMs)
  }

  function remove() {
    if (state === 'done') return
    state = 'done'
    video.pause()
    video.removeAttribute('src')
    video.load()
    if (dialog.open) dialog.close()
    dialog.remove()
    root.setAttribute('data-intro', 'done')
  }

  d.addEventListener('keydown', onKey, true)
  reduce.addEventListener('change', onReduce)
  dialog.addEventListener('cancel', function (e) {
    e.preventDefault()
    lift('skip')
  })
  dialog.addEventListener('close', function () {
    lift('skip')
    remove()
  })
  dialog.addEventListener('wheel', stop, { passive: false })
  dialog.addEventListener('touchmove', stop, { passive: false })
  dialog.addEventListener('contextmenu', stop)
  skip.addEventListener('click', function () { lift('skip') })
  video.addEventListener('playing', function () { started = true })
  video.addEventListener('error', function () { lift('fail') })
  video.addEventListener('ended', function () { lift('end') })
  video.addEventListener('timeupdate', function () {
    if (video.currentTime >= film.handoff) lift('end')
  })
  video.src = film.src
  var playing = video.play()
  if (playing && playing.catch) playing.catch(function () { lift('fail') })
}`

/** The inline script for one locale's pages. */
export function introScript(config: IntroScriptConfig): string {
  const data = JSON.stringify({
    ...config,
    key: INTRO_SESSION_KEY,
    portrait: INTRO_PORTRAIT_QUERY,
    films: INTRO_FILMS,
    startMs: INTRO_START_TIMEOUT_MS,
    stallMs: INTRO_STALL_MS,
    removeMs: REMOVE_AFTER_MS,
  }).replace(/</g, '\\u003c')
  // Indentation is only for reading here; every page carries the script.
  return `(${runtime.replace(/^\s+/gm, '')})(${data});`
}
