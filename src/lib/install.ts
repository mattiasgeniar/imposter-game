import { useCallback, useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type NavigatorIOS = Navigator & { standalone?: boolean }

export function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  return (navigator as NavigatorIOS).standalone === true
}

export function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  // Modern iPadOS hides "iPad" in the UA string but reports MacIntel + touch.
  const isIPadModern =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || isIPadModern
}

export function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  if (detectIOS()) return true
  return /Android|Mobile/i.test(navigator.userAgent)
}

export type InstallState = {
  /** True when the app can be added to the home screen (event captured, or iOS). */
  canInstall: boolean
  /** True on iOS — install requires the Share menu, can't be triggered programmatically. */
  isIOS: boolean
  /** True when the app is already running standalone / installed. */
  installed: boolean
  /** True when we have a beforeinstallprompt event ready to fire. */
  hasPromptEvent: boolean
  /** Returns 'accepted' | 'dismissed' | 'unavailable'. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

export function useInstallPrompt(): InstallState {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(() => detectStandalone())

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setEvent(null)
      setInstalled(true)
    }
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayChange = () => setInstalled(detectStandalone())

    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstalled)
    standaloneQuery?.addEventListener?.('change', onDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
      standaloneQuery?.removeEventListener?.('change', onDisplayChange)
    }
  }, [])

  const isIOS = useMemo(() => detectIOS(), [])
  const isMobile = useMemo(() => detectMobile(), [])
  const hasPromptEvent = event !== null
  const canInstall = !installed && isMobile && (hasPromptEvent || isIOS)

  const promptInstall = useCallback(async () => {
    if (!event) return 'unavailable' as const
    try {
      await event.prompt()
      const choice = await event.userChoice
      setEvent(null)
      return choice.outcome
    } catch {
      return 'dismissed' as const
    }
  }, [event])

  return { canInstall, isIOS, installed, hasPromptEvent, promptInstall }
}
