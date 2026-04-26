type Props = {
  value: number
  min: number
  max: number
  step?: number
  decreaseLabel: string
  increaseLabel: string
  onChange: (n: number) => void
  format?: (n: number) => string
}

export function Stepper({ value, min, max, step = 1, decreaseLabel, increaseLabel, onChange, format }: Props) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  const display = format ? format(value) : String(value)
  const stepBtn =
    'h-12 w-12 rounded-full bg-line text-white text-2xl press-ios ' +
    'active:opacity-80 disabled:opacity-40'
  return (
    <div className="flex items-center justify-center gap-6 select-none">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className={stepBtn}
        aria-label={decreaseLabel}
      >
        −
      </button>
      <div
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={display}
        className="text-3xl font-bold tabular-nums min-w-[5ch] text-center"
      >
        {display}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={stepBtn}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  )
}
