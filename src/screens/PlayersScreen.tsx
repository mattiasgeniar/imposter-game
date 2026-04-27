import { useState } from 'react'
import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useT } from '../i18n/LocaleProvider'

type Props = {
  players: string[]
  /** ISO date of the previous round, used to flag a stale list. */
  lastPlayed: string | null
  onAdd: (name: string) => void
  onRemove: (index: number) => void
  onContinue: () => void
  onBack: () => void
  /** Which translation key drives the footer button label. */
  continueLabel: 'continue' | 'done'
}

const MIN_PLAYERS = 3

export function PlayersScreen({
  players,
  lastPlayed,
  onAdd,
  onRemove,
  onContinue,
  onBack,
  continueLabel,
}: Props) {
  const t = useT()
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    onAdd(name)
    setName('')
  }

  const canContinue = players.length >= MIN_PLAYERS
  const today = new Date().toISOString().slice(0, 10)
  const isStale =
    lastPlayed !== null && lastPlayed !== today && players.length >= MIN_PLAYERS

  return (
    <Screen
      footer={
        <Button onClick={onContinue} disabled={!canContinue}>
          <span className="flex items-center justify-between w-full">
            <span>{t(continueLabel === 'done' ? 'players.done' : 'players.continue')}</span>
            <span className="text-sm font-normal text-ink/60">
              {t('players.countSuffix', { count: players.length })}
            </span>
          </span>
        </Button>
      }
    >
      <ScreenHeader title={t('players.title')} onBack={onBack} />

      {isStale && (
        <div className="bg-card border border-line rounded-2xl px-4 py-3 mb-3">
          <p className="text-sm text-white/80 leading-snug">
            {t('players.staleHint', { date: lastPlayed })}
          </p>
        </div>
      )}

      <div className="flex-1 scroll-smooth-y pb-2 space-y-2">
        {players.map((p, i) => (
          <div key={p} className="flex items-center bg-card border border-line rounded-2xl px-4 py-3">
            <span className="flex-1 font-semibold truncate">{p}</span>
            <button
              onClick={() => onRemove(i)}
              className="text-white/60 active:text-white text-xl px-2"
              aria-label={t('players.remove')}
            >
              ✕
            </button>
          </div>
        ))}

        <form
          onSubmit={(e) => { e.preventDefault(); submit() }}
          className="flex items-center gap-2 mt-2"
        >
          <input
            name="playerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('players.placeholder')}
            className="flex-1 bg-card border border-line rounded-2xl px-4 h-12 text-white placeholder:text-white/40 outline-none focus:border-white/40"
            maxLength={20}
            autoCapitalize="words"
            autoCorrect="off"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-12 w-12 rounded-full bg-card border border-line text-2xl active:bg-line disabled:opacity-40"
            aria-label={t('players.add')}
          >
            +
          </button>
        </form>

        {!canContinue && (
          <p className="text-white/50 text-sm text-center pt-4">
            {t('players.minHint', { min: MIN_PLAYERS })}
          </p>
        )}
      </div>
    </Screen>
  )
}
