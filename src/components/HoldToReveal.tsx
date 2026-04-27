import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { WaveFill } from './WaveFill'

const HOLD_MS = 800
const RELEASE_MS = 120

type Props = {
  prompt: string
  children: ReactNode
  onFullyRevealed?: () => void
}

export function HoldToReveal({ prompt, children, onFullyRevealed }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [holding, setHolding] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const clearPending = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const cancel = () => {
    clearPending()
    setHolding(false)
    setRevealed(false)
  }

  useEffect(() => () => clearPending(), [])

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    clearPending()
    setHolding(true)
    // setTimeout fires reliably on iOS Safari even when rAF is throttled during
    // touch — the previous rAF-driven fill stalled for ~500ms then jumped to
    // full at the end of the hold. The visual is now driven by a CSS transition
    // tied to `holding`; this timeout only flips the reveal state at HOLD_MS.
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      setRevealed((wasRevealed) => {
        if (!wasRevealed) onFullyRevealed?.()
        return true
      })
    }, HOLD_MS)
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
      <WaveFill
        percent={holding ? 100 : 0}
        transitionMs={holding ? HOLD_MS : RELEASE_MS}
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
