import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ExitRoundButton } from '../components/ExitRoundButton'
import { WaveFill } from '../components/WaveFill'
import { useLocale, useT } from '../i18n/LocaleProvider'
import { formatTime } from '../game/format'
import { playRoundEndCue, preloadRoundEndCue } from '../lib/sound'

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

  // Tick every 250ms so the digit display and wave-fill height stay in sync
  // even when the OS throttles us. The visible wave wobble is a separate CSS
  // animation that runs continuously regardless of React rerenders.
  useEffect(() => {
    // Decode the bell ahead of time so it's instant when the timer hits 0.
    // Safe to call on every mount — the module caches the Audio element.
    preloadRoundEndCue()

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
        playRoundEndCue()
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

      <ExitRoundButton onConfirm={onAbort} />

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
    </Screen>
  )
}
