import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ExitRoundButton } from '../components/ExitRoundButton'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  name: string
  index: number
  total: number
  variant: 'reveal' | 'vote'
  onContinue: () => void
  onAbort: () => void
}

export function HandoffScreen({ name, index, total, variant, onContinue, onAbort }: Props) {
  const t = useT()
  const subtitle = variant === 'reveal' ? t('handoff.reveal.subtitle') : t('handoff.vote.subtitle')
  const tap = variant === 'reveal' ? t('handoff.reveal.tap') : t('handoff.vote.tap')
  return (
    <Screen footer={<Button onClick={onContinue}>{tap}</Button>}>
      <ExitRoundButton onConfirm={onAbort} />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
        <div className="text-6xl" aria-hidden>📱</div>
        <p className="text-white/60 uppercase tracking-widest text-xs">
          {t('handoff.passTo')}
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight break-words max-w-full">{name}</h1>
        <p className="text-white/60 mt-2">{subtitle}</p>
        <p className="text-white/40 text-sm pt-4">
          {t('handoff.progress', { current: index + 1, total })}
        </p>
      </div>
    </Screen>
  )
}
