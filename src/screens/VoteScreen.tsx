import { useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  voterName: string
  voterIndex: number
  players: string[]
  candidateIndices: number[]
  onConfirm: (target: number) => void
}

export function VoteScreen({ voterName, voterIndex, players, candidateIndices, onConfirm }: Props) {
  const t = useT()
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <Screen
      footer={
        <Button
          disabled={selected === null}
          onClick={() => selected !== null && onConfirm(selected)}
        >
          {t('vote.confirm')}
        </Button>
      }
    >
      <div className="text-center pt-4 pb-3">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('vote.youAre')}</p>
        <h2 className="text-2xl font-bold mt-1">{voterName}</h2>
        <p className="text-white/60 mt-3">{t('vote.prompt')}</p>
      </div>

      <div role="group" aria-label={t('vote.prompt')} className="flex-1 scroll-smooth-y space-y-2 pb-2">
        {candidateIndices.map((i) => {
          if (i === voterIndex) return null
          const isSel = selected === i
          return (
            <button
              key={i}
              type="button"
              aria-pressed={isSel}
              onClick={() => setSelected(i)}
              className={
                `w-full text-left rounded-2xl px-4 py-4 border font-semibold press-ios-soft ` +
                (isSel ? 'bg-accent text-ink border-accent' : 'bg-card text-white border-line')
              }
            >
              {players[i]}
            </button>
          )
        })}
      </div>
    </Screen>
  )
}
