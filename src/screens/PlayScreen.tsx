import { useEffect, useRef, useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useLocale, useT } from '../i18n/LocaleProvider'
import { formatTime } from '../game/format'

type Props = {
  totalSeconds: number
  categoryId: string
  onFinish: () => void
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

export function PlayScreen({ totalSeconds, categoryId, onFinish }: Props) {
  const t = useT()
  const { bundle } = useLocale()
  const meta = bundle?.categories[categoryId]
  const [remaining, setRemaining] = useState(totalSeconds)

  // Tick every second for the digit display. The visual fill is driven by a
  // CSS animation (see .timer-fill below) so it stays buttery-smooth at 60fps
  // independent of the React tick.
  useEffect(() => {
    let stopped = false
    const startedAt = performance.now()
    const id = window.setInterval(() => {
      if (stopped) return
      const elapsed = (performance.now() - startedAt) / 1000
      const left = Math.max(0, Math.ceil(totalSeconds - elapsed))
      setRemaining(left)
      if (left <= 0) {
        stopped = true
        clearInterval(id)
      }
    }, 1000)
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

  return (
    <Screen
      footer={
        <Button onClick={onFinish} variant={expired ? 'primary' : 'secondary'}>
          {expired ? t('play.toVote') : t('play.skip')}
        </Button>
      }
    >
      {/* Fill is a fire-and-forget CSS animation tied to wall-clock duration —
          stays in sync with the React timer because both compute from the same
          mount time, and the element unmounts when the phase advances. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-x-0 bottom-0 bg-accent/30 will-change-[height]"
          style={{ animation: `round-fill ${totalSeconds}s linear forwards` }}
        />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-white/60 uppercase tracking-widest text-xs">
          {t('play.category')}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden>{meta?.emoji ?? '❓'}</span>
          <span className="text-2xl font-bold">{meta?.name ?? categoryId}</span>
        </div>
        <div className="mt-8 text-7xl font-extrabold tabular-nums tracking-tight">
          {formatTime(remaining)}
        </div>
        <div className="text-white/60 mt-3 max-w-xs leading-snug">
          {t('play.instructions')}
        </div>
      </div>
    </Screen>
  )
}
