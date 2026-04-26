import { useEffect } from 'react'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  isIOS: boolean
  onInstall: () => void
  onDismiss: () => void
  /** Auto-dismiss after this many ms; pass 0 to disable. */
  autoHideMs?: number
}

export function InstallToast({ isIOS, onInstall, onDismiss, autoHideMs = 10000 }: Props) {
  const t = useT()

  useEffect(() => {
    if (!autoHideMs) return
    const id = window.setTimeout(onDismiss, autoHideMs)
    return () => clearTimeout(id)
  }, [autoHideMs, onDismiss])

  const title = isIOS ? t('install.toast.iosTitle') : t('install.toast.title')
  const subtitle = isIOS ? t('install.toast.iosSubtitle') : t('install.toast.subtitle')

  return (
    <div
      className={
        'bg-card/95 backdrop-blur border border-line rounded-2xl ' +
        'px-3 py-2.5 flex items-center gap-3 shadow-lg shadow-black/30 install-toast'
      }
      role="status"
      aria-live="polite"
    >
      <div className="text-2xl shrink-0" aria-hidden>📲</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">{title}</p>
        <p className="text-xs text-white/60 leading-snug mt-0.5">{subtitle}</p>
      </div>
      {!isIOS && (
        <button
          type="button"
          onClick={onInstall}
          className="press-ios shrink-0 h-8 px-3 rounded-lg bg-white text-ink text-sm font-semibold"
        >
          {t('install.toast.cta')}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('install.toast.dismiss')}
        className="press-ios shrink-0 h-8 w-8 -mr-1 flex items-center justify-center text-white/50 active:text-white text-xl leading-none"
      >
        ×
      </button>
    </div>
  )
}
