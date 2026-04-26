import type { ReactNode } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  onStart: () => void
  onOpenSettings: () => void
  /** Optional banner rendered above the Play button (e.g. install prompt). */
  banner?: ReactNode
}

export function HomeScreen({ onStart, onOpenSettings, banner }: Props) {
  const t = useT()
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="text-7xl" aria-hidden>🎭</div>
        <h1 className="text-5xl font-extrabold tracking-tight">{t('home.title')}</h1>
        <p className="text-white/70 max-w-xs">{t('home.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 pb-safe">
        {banner}
        <Button onClick={onStart}>{t('home.start')}</Button>
        <Button variant="ghost" onClick={onOpenSettings}>{t('home.settingsLink')}</Button>
      </div>
    </Screen>
  )
}
