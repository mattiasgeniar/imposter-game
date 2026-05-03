import { useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ExitRoundButton } from '../components/ExitRoundButton'
import { HoldToReveal } from '../components/HoldToReveal'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  playerName: string
  isImposter: boolean
  word: string
  hint: string
  hintsEnabled: boolean
  onContinue: () => void
  onAbort: () => void
}

export function RevealScreen({ playerName, isImposter, word, hint, hintsEnabled, onContinue, onAbort }: Props) {
  const t = useT()
  const [seen, setSeen] = useState(false)

  return (
    <Screen
      footer={
        <Button onClick={onContinue} disabled={!seen}>
          {t('reveal.continue')}
        </Button>
      }
    >
      <ExitRoundButton onConfirm={onAbort} />
      <div className="text-center pt-4 pb-3">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('reveal.youAre')}</p>
        <h2 className="text-2xl font-bold mt-1">{playerName}</h2>
      </div>

      <HoldToReveal
        prompt={t('reveal.holdPrompt')}
        onFullyRevealed={() => setSeen(true)}
      >
        {isImposter ? (
          <div>
            <div className="text-6xl mb-3" aria-hidden>🕵️</div>
            <div className="text-4xl font-extrabold text-accent tracking-tight">
              {t('reveal.imposter')}
            </div>
            {hintsEnabled && hint && (
              <div className="mt-4 text-white/80">
                <span className="text-white/50 text-sm">{t('reveal.hintLabel')}: </span>
                <span className="font-semibold">{hint}</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-white/50 text-sm uppercase tracking-widest mb-2">
              {t('reveal.theWord')}
            </div>
            <div className="text-4xl font-extrabold tracking-tight break-words">{word}</div>
          </div>
        )}
      </HoldToReveal>

      <p className="text-white/40 text-xs text-center pt-3">
        {t('reveal.holdHint')}
      </p>
    </Screen>
  )
}
