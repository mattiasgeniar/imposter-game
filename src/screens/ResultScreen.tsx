import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  eliminatedName: string
  imposterNames: string[]
  wasImposter: boolean
  onContinue: () => void
}

export function ResultScreen({ eliminatedName, imposterNames, wasImposter, onContinue }: Props) {
  const t = useT()
  return (
    <Screen footer={<Button onClick={onContinue}>{t('result.continue')}</Button>}>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-2">
        <div className="text-7xl" aria-hidden>{wasImposter ? '🎯' : '😮'}</div>
        <p className="text-white/60 uppercase tracking-widest text-xs">{t('result.mostVoted')}</p>
        <h1 className="text-4xl font-extrabold tracking-tight break-words max-w-full">
          {eliminatedName}
        </h1>
        <div
          className={`mt-4 px-4 py-3 rounded-2xl font-bold text-lg ${
            wasImposter ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
          }`}
        >
          {wasImposter ? t('result.wasImposter') : t('result.wasInnocent')}
        </div>
        {!wasImposter && imposterNames.length > 0 && (
          <p className="text-white/60 mt-2 max-w-xs">
            {t('result.imposterWere', { names: imposterNames.join(', ') })}
          </p>
        )}
      </div>
    </Screen>
  )
}
