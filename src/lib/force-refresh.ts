/**
 * Tear down the service worker and its precache, then reload bypassing the
 * HTTP cache via a query param. Only useful when running as an installed PWA:
 * a regular browser tab can just hit the refresh button.
 *
 * localStorage is untouched, so player names / settings survive.
 */
export async function forceRefresh(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)))
    }
  } catch {
    /* ignore — still reload below */
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)))
    }
  } catch {
    /* ignore — still reload below */
  }
  const url = new URL(window.location.href)
  url.searchParams.set('_r', Date.now().toString())
  window.location.replace(url.toString())
}
