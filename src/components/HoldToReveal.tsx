import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const HOLD_MS = 800

type Props = {
  prompt: string
  children: ReactNode
  onFullyRevealed?: () => void
}

export function HoldToReveal({ prompt, children, onFullyRevealed }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [progress, setProgress] = useState(0)
  const startedAt = useRef<number | null>(null)
  const raf = useRef<number | null>(null)

  const stopLoop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = null
  }

  const cancel = () => {
    stopLoop()
    startedAt.current = null
    setRevealed(false)
    setProgress(0)
  }

  useEffect(() => () => stopLoop(), [])

  const tick = () => {
    if (startedAt.current === null) return
    // tick runs from requestAnimationFrame, not during render — performance.now is safe here.
    // eslint-disable-next-line react-hooks/purity
    const elapsed = performance.now() - startedAt.current
    const p = Math.min(1, elapsed / HOLD_MS)
    setProgress(p)
    if (p >= 1) {
      stopLoop()
      setRevealed((wasRevealed) => {
        if (!wasRevealed) onFullyRevealed?.()
        return true
      })
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    stopLoop()
    startedAt.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  const onUp = () => cancel()

  return (
    <div
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      className="relative flex-1 rounded-3xl bg-card border border-line overflow-hidden flex items-center justify-center select-none touch-none"
    >
      <div
        className="absolute inset-0 bg-accent/20 origin-bottom transition-transform duration-75 ease-out"
        style={{ transform: `scaleY(${progress})` }}
      />
      {revealed ? (
        <div className="relative z-10 w-full px-6 text-center">{children}</div>
      ) : (
        <div className="relative z-10 px-8 text-center">
          <div className="text-6xl mb-4" aria-hidden>👆</div>
          <p className="text-lg text-white/80 leading-snug">{prompt}</p>
        </div>
      )}
    </div>
  )
}
