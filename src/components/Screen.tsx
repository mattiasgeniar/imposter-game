import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Screen({ children, footer, className = '' }: Props) {
  return (
    <div className={`h-dvh flex flex-col bg-ink text-white pt-safe pl-safe pr-safe ${className}`}>
      <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">{children}</div>
      {footer && (
        <div className="bg-surface border-t border-line px-4 py-3 pb-safe">{footer}</div>
      )}
    </div>
  )
}
