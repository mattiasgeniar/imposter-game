import { flushSync } from 'react-dom'

type Direction = 'forward' | 'back'

type DocumentWithVT = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

/**
 * Wraps a state-changing callback in a View Transition so the screen change
 * animates iOS-style (slide-from-right for forward, slide-from-left for back).
 *
 * Falls back to a plain synchronous update on browsers without the API and on
 * any transition-start failure (e.g. rapid taps that fire a second transition
 * while the first is still in-flight — Chrome/Safari throws a DOMException
 * there). In every code path the dispatch must run, otherwise the user is
 * stuck on a screen whose handler appeared to do nothing.
 */
export function withTransition(direction: Direction, mutate: () => void) {
  const doc = document as DocumentWithVT
  if (typeof doc.startViewTransition !== 'function') {
    mutate()
    return
  }
  document.documentElement.dataset.nav = direction
  const cleanup = () => {
    if (document.documentElement.dataset.nav === direction) {
      delete document.documentElement.dataset.nav
    }
  }
  try {
    const transition = doc.startViewTransition(() => flushSync(mutate))
    transition.finished.then(cleanup, cleanup)
  } catch {
    // Transition could not start (e.g. another one is active). Apply the
    // mutation anyway and clean the attribute so subsequent transitions aren't
    // forced into the wrong direction.
    cleanup()
    mutate()
  }
}
