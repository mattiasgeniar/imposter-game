import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'md' | 'lg'
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-white text-ink active:bg-white/90 disabled:bg-white/30 disabled:text-ink/40',
  secondary: 'bg-card text-white border border-line active:bg-line',
  ghost: 'bg-transparent text-white active:bg-white/10',
  danger: 'bg-danger text-white active:bg-danger/90',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...rest
}: Props) {
  const sizeCls = size === 'lg' ? 'h-14 text-lg' : 'h-11 text-base'
  return (
    <button
      type={rest.type ?? 'button'}
      className={
        `${sizeCls} ${VARIANTS[variant]} px-6 rounded-2xl font-semibold tracking-tight w-full press-ios ${className}`
      }
      {...rest}
    >
      {children}
    </button>
  )
}
