import { useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'
import type { CategoryWord } from '../game/types'

type Props = {
  imposterName: string
  words: CategoryWord[]
  onGuess: (word: string) => void
}

export function ImposterGuessScreen({ imposterName, words, onGuess }: Props) {
  const t = useT()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Screen
      footer={
        <Button onClick={() => selected && onGuess(selected)} disabled={!selected}>
          {t('guess.confirm')}
        </Button>
      }
    >
      <div className="text-center pt-3 pb-2">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('guess.youAre')}</p>
        <h2 className="text-2xl font-bold mt-1">{imposterName}</h2>
        <p className="text-white/70 mt-3 leading-snug max-w-xs mx-auto">{t('guess.prompt')}</p>
      </div>

      <div className="flex-1 scroll-smooth-y pb-2">
        <div role="group" aria-label={t('guess.prompt')} className="grid grid-cols-2 gap-2">
          {words.map(({ word }) => (
            <button
              key={word}
              type="button"
              aria-pressed={selected === word}
              onClick={() => setSelected(word)}
              className={
                `rounded-xl py-3 px-2 text-sm font-semibold border press-ios ` +
                (selected === word
                  ? 'bg-accent text-ink border-accent'
                  : 'bg-card text-white border-line')
              }
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}
