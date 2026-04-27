import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Screen({ children, footer, className = '' }: Props) {
  // The children area and footer are capped at a phone-app width and centered
  // so the layout doesn't stretch into a runway on iPads/tablets/desktop.
  // Phones stay edge-to-edge (their viewport is narrower than max-w-md).
  return (
    <div className={`h-dvh flex flex-col bg-ink text-white pt-safe pl-safe pr-safe ${className}`}>
      <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden w-full max-w-md mx-auto">
        {children}
      </div>
      {footer && (
        <div className="w-full max-w-md mx-auto px-4 pt-3 pb-safe">{footer}</div>
      )}
    </div>
  )
}
