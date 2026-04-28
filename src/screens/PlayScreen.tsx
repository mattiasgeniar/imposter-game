import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { WaveFill } from '../components/WaveFill'
import { useLocale, useT } from '../i18n/LocaleProvider'
import { formatTime } from '../game/format'

type Props = {
  totalSeconds: number
  categoryId: string
  starterName: string
  onFinish: () => void
  onAbort: () => void
}

type WakeLockSentinel = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
  removeEventListener: (type: 'release', listener: () => void) => void
}
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
}

export function PlayScreen({ totalSeconds, categoryId, starterName, onFinish, onAbort }: Props) {
  const t = useT()
  const { bundle } = useLocale()
  const meta = bundle?.categories[categoryId]
  const [remaining, setRemaining] = useState(totalSeconds)
  const [confirmingExit, setConfirmingExit] = useState(false)

  // Tick every 250ms so the digit display and wave-fill height stay in sync
  // even when the OS throttles us. The visible wave wobble is a separate CSS
  // animation that runs continuously regardless of React rerenders.
  useEffect(() => {
    let stopped = false
    const startedAt = performance.now()
    const id = window.setInterval(() => {
      if (stopped) return
      const elapsed = (performance.now() - startedAt) / 1000
      const left = Math.max(0, totalSeconds - elapsed)
      setRemaining(left)
      if (left <= 0) {
        stopped = true
        clearInterval(id)
      }
    }, 250)
    return () => { stopped = true; clearInterval(id) }
  }, [totalSeconds])

  // Wake lock: hold the screen on for the duration of this round.
  // Reacquire when the page becomes visible again (the spec drops the lock when
  // the page hides), and also when the sentinel emits its own 'release' event —
  // some browsers drop the lock for reasons beyond visibility. Cleanup releases
  // defensively so a quick mount/unmount under StrictMode doesn't leak.
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  useEffect(() => {
    let cancelled = false
    const nav = navigator as NavigatorWithWakeLock
    if (!nav.wakeLock) return

    const onSentinelReleased = () => {
      sentinelRef.current = null
      if (!cancelled && document.visibilityState === 'visible') acquire()
    }

    const acquire = async () => {
      try {
        const sentinel = await nav.wakeLock!.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinel.addEventListener('release', onSentinelReleased)
        sentinelRef.current = sentinel
      } catch {
        /* user gesture missing or denied; ignore */
      }
    }

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (sentinelRef.current && !sentinelRef.current.released) return
      acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel) {
        sentinel.removeEventListener('release', onSentinelReleased)
        sentinel.release().catch(() => {})
      }
    }
  }, [])

  const expired = remaining <= 0

  if (expired) {
    return (
      <Screen footer={<Button onClick={onFinish}>{t('play.startVote')}</Button>}>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <div className="text-7xl" aria-hidden>⏰</div>
          <h1 className="text-5xl font-extrabold tracking-tight">{t('play.timeUp')}</h1>
          <p className="text-white/70 max-w-xs">{t('play.timeUpSubtitle')}</p>
        </div>
      </Screen>
    )
  }

  // Fill rises from 0% (full screen) to 100% (touching the top) as the round runs.
  const filledPercent = Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))

  // While the timer is running there is no "skip to vote" button — to prevent
  // accidental taps that throw the round away. The only escape hatch is the
  // top-right ✕ which routes back to settings.
  return (
    <Screen>
      <WaveFill percent={filledPercent} />

      <div className="absolute top-0 right-0 z-20 pt-safe pr-safe">
        <button
          type="button"
          onClick={() => setConfirmingExit(true)}
          aria-label={t('play.exit')}
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-line text-white/80 active:bg-line text-xl press-ios-soft flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-white/60 uppercase tracking-widest text-xs">
          {t('play.category')}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden>{meta?.emoji ?? '❓'}</span>
          <span className="text-2xl font-bold">{meta?.name ?? categoryId}</span>
        </div>
        <div className="mt-8 text-7xl font-extrabold tabular-nums tracking-tight">
          {formatTime(Math.ceil(remaining))}
        </div>
        <div className="mt-4 text-xl font-semibold max-w-xs leading-snug">
          {t('play.starter', { name: starterName })}
        </div>
        <div className="text-white/60 mt-1 max-w-xs leading-snug text-sm">
          {t('play.instructions')}
        </div>
      </div>

      {confirmingExit && (
        <ExitConfirmation
          onCancel={() => setConfirmingExit(false)}
          onConfirm={onAbort}
        />
      )}
    </Screen>
  )
}

function ExitConfirmation({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const t = useT()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('play.exitConfirm.title')}
      className="fixed inset-0 z-30 flex items-start justify-center px-4 pt-safe bg-ink/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mt-3 w-full max-w-sm bg-card border border-line rounded-2xl p-5 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold leading-tight">{t('play.exitConfirm.title')}</h2>
        <p className="text-sm text-white/70 leading-snug">{t('play.exitConfirm.body')}</p>
        <div className="flex gap-2 pt-1">
          <div className="flex-1">
            <Button size="md" variant="secondary" onClick={onCancel}>
              {t('play.exitConfirm.keep')}
            </Button>
          </div>
          <div className="flex-1">
            <Button size="md" variant="danger" onClick={onConfirm}>
              {t('play.exitConfirm.quit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
