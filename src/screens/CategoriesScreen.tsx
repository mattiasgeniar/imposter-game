import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useLocale, useT } from '../i18n/LocaleProvider'
import { CATEGORY_IDS } from '../i18n/locales'

type Props = {
  selected: string[]
  onToggle: (id: string) => void
  onContinue: () => void
  onBack: () => void
}

export function CategoriesScreen({ selected, onToggle, onContinue, onBack }: Props) {
  const t = useT()
  const { bundle } = useLocale()
  const canContinue = selected.length >= 1

  return (
    <Screen
      footer={
        <Button onClick={onContinue} disabled={!canContinue}>
          <span className="flex items-center justify-between w-full">
            <span>{t('categories.continue')}</span>
            <span className="text-sm font-normal text-ink/60">
              {t('categories.countSuffix', { count: selected.length })}
            </span>
          </span>
        </Button>
      }
    >
      <ScreenHeader title={t('categories.title')} onBack={onBack} />

      <div className="flex-1 scroll-smooth-y space-y-3 pb-2">
        {CATEGORY_IDS.map((id) => {
          const meta = bundle?.categories[id]
          if (!meta) return null
          const isSelected = selected.includes(id)
          return (
            <button
              key={id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggle(id)}
              className={
                `w-full text-left bg-card rounded-2xl px-4 py-4 flex items-start gap-3 border press-ios-soft ` +
                (isSelected ? 'border-accent ring-2 ring-accent/40' : 'border-line')
              }
            >
              <div className="text-3xl leading-none mt-0.5" aria-hidden>{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg leading-tight">{meta.name}</div>
                <div className="text-sm text-white/60 mt-1 leading-snug">{meta.description}</div>
              </div>
              <div className={`h-6 w-6 rounded-full mt-1 flex items-center justify-center text-sm ${
                isSelected ? 'bg-accent text-ink' : 'bg-line text-transparent'
              }`} aria-hidden>✓</div>
            </button>
          )
        })}
      </div>
    </Screen>
  )
}
