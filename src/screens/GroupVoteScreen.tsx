import { useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  players: string[]
  onConfirm: (target: number) => void
}

export function GroupVoteScreen({ players, onConfirm }: Props) {
  const t = useT()
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <Screen
      footer={
        <Button
          disabled={selected === null}
          onClick={() => selected !== null && onConfirm(selected)}
        >
          {t('groupVote.confirm')}
        </Button>
      }
    >
      <div className="text-center pt-4 pb-3">
        <p className="text-white/50 text-sm uppercase tracking-widest">{t('groupVote.title')}</p>
        <p className="text-white/70 mt-2 max-w-sm mx-auto">{t('groupVote.prompt')}</p>
      </div>

      <div role="group" aria-label={t('groupVote.prompt')} className="flex-1 scroll-smooth-y space-y-2 pb-2">
        {players.map((name, i) => {
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
              {name}
            </button>
          )
        })}
      </div>
    </Screen>
  )
}
