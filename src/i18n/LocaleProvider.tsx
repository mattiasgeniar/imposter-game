import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../game/types'
import { loadLocale, saveLocale } from '../game/persistence'
import { detectLocale, loadLocaleBundle, type LocaleBundle } from './locales'

type Ctx = {
  locale: Locale
  bundle: LocaleBundle | null
  loadError: boolean
  setLocale: (l: Locale) => void
}

const LocaleCtx = createContext<Ctx | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale() ?? detectLocale())
  const [bundle, setBundle] = useState<LocaleBundle | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Reset bundle/error when locale changes so the UI shows the loading state
    // until the new bundle resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBundle(null)
    setLoadError(false)
    loadLocaleBundle(locale)
      .then((b) => { if (!cancelled) setBundle(b) })
      .catch(async () => {
        if (cancelled) return
        // Fall back to the other shipped locale so users aren't stuck on "…",
        // and persist the fallback so a broken stored locale doesn't keep failing
        // on every launch.
        const fallback: Locale = locale === 'en' ? 'nl-BE' : 'en'
        try {
          const b = await loadLocaleBundle(fallback)
          if (!cancelled) {
            setBundle(b)
            setLocaleState(fallback)
            saveLocale(fallback)
          }
        } catch {
          if (!cancelled) setLoadError(true)
        }
      })
    return () => { cancelled = true }
  }, [locale])

  useEffect(() => { document.documentElement.setAttribute('lang', locale) }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    saveLocale(l)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ locale, bundle, loadError, setLocale }),
    [locale, bundle, loadError, setLocale],
  )

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale() {
  const ctx = useContext(LocaleCtx)
  if (!ctx) throw new Error('LocaleProvider missing')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT() {
  const { bundle } = useLocale()
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = bundle?.ui[key] ?? key
      if (!vars) return raw
      return Object.entries(vars).reduce<string>(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
        raw,
      )
    },
    [bundle],
  )
}
