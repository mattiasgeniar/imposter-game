import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { useT } from '../i18n/LocaleProvider'
import type { Winner } from '../game/types'

type Props = {
  winner: Winner
  word: string
  imposterNames: string[]
  onPlayAgain: () => void
  onHome: () => void
}

export function RoundEndScreen({ winner, word, imposterNames, onPlayAgain, onHome }: Props) {
  const t = useT()
  return (
    <Screen
      footer={
        <div className="space-y-2">
          <Button onClick={onPlayAgain}>{t('roundEnd.playAgain')}</Button>
          <Button variant="ghost" onClick={onHome}>{t('roundEnd.home')}</Button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-2">
        <div className="text-7xl" aria-hidden>{winner === 'crew' ? '🏆' : '🕵️'}</div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          {winner === 'crew' ? t('roundEnd.crewWins') : t('roundEnd.imposterWins')}
        </h1>
        <div className="bg-card border border-line rounded-2xl p-4 max-w-xs w-full">
          <p className="text-white/60 text-sm uppercase tracking-widest">{t('roundEnd.theWord')}</p>
          <p className="text-2xl font-bold mt-1 break-words">{word}</p>
        </div>
        {imposterNames.length > 0 && (
          <p className="text-white/60 max-w-xs">
            {t('roundEnd.imposterWas', { names: imposterNames.join(', ') })}
          </p>
        )}
      </div>
    </Screen>
  )
}
