import { useCallback, useEffect, useReducer, useState } from 'react'
import { useInstallPrompt } from '@mattiasgeniar/pwa-install-prompt'
import { LocaleProvider, useLocale } from './i18n/LocaleProvider'
import { arePlayersStale, initialState, reducer } from './game/machine'
import type { Action } from './game/machine'
import {
  saveCategories,
  savePlayers,
  saveSettings,
} from './game/persistence'
import { withTransition } from './lib/navigate'
import { Button } from './components/Button'
import { InstallToast } from './components/InstallToast'
import { HomeScreen } from './screens/HomeScreen'
import { PlayersScreen } from './screens/PlayersScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { HandoffScreen } from './screens/HandoffScreen'
import { RevealScreen } from './screens/RevealScreen'
import { PlayScreen } from './screens/PlayScreen'
import { VoteScreen } from './screens/VoteScreen'
import { GroupVoteScreen } from './screens/GroupVoteScreen'
import { ResultScreen } from './screens/ResultScreen'
import { ImposterGuessScreen } from './screens/ImposterGuessScreen'
import { RoundEndScreen } from './screens/RoundEndScreen'

function Game() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const { bundle, loadError } = useLocale()
  const install = useInstallPrompt()
  const [showInstallToast, setShowInstallToast] = useState(true)

  useEffect(() => savePlayers(state.players), [state.players])
  useEffect(() => saveCategories(state.selectedCategoryIds), [state.selectedCategoryIds])
  useEffect(() => saveSettings(state.settings), [state.settings])

  // Phase changes go through View Transitions so the screen swap animates.
  // In-place updates (toggling a category, editing a setting) skip this.
  const navigate = useCallback(
    (action: Action, direction: 'forward' | 'back' = 'forward') => {
      withTransition(direction, () => dispatch(action))
    },
    [],
  )

  if (loadError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-ink text-white/80 px-6 text-center">
        <div className="text-5xl" aria-hidden>⚠️</div>
        <p className="text-lg font-semibold">Could not load language pack.</p>
        <div className="mt-2 w-full max-w-xs">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-white/50">
        …
      </div>
    )
  }

  switch (state.phase) {
    case 'home':
      return (
        <HomeScreen
          onStart={() => {
            // Skip the player-edit step on same-day replays — names from earlier
            // today almost certainly still apply. On a new day or with too few
            // players we route through the players screen so the host can confirm.
            if (arePlayersStale(state)) {
              navigate({ type: 'openPlayers', origin: 'home' })
            } else {
              navigate({ type: 'goto', phase: 'categories' })
            }
          }}
          onOpenSettings={() => navigate({ type: 'openSettings', origin: 'home' })}
          banner={
            install.canInstall && showInstallToast ? (
              <InstallToast
                isIOS={install.isIOS}
                onInstall={async () => {
                  const outcome = await install.promptInstall()
                  if (outcome !== 'unavailable') setShowInstallToast(false)
                }}
                onDismiss={() => setShowInstallToast(false)}
              />
            ) : undefined
          }
        />
      )

    case 'players': {
      const fromSettings = state.playersOrigin === 'settings'
      return (
        <PlayersScreen
          players={state.players}
          lastPlayed={state.lastPlayed}
          onAdd={(name) => dispatch({ type: 'addPlayer', name })}
          onRemove={(i) => dispatch({ type: 'removePlayer', index: i })}
          onContinue={() =>
            navigate({ type: 'goto', phase: fromSettings ? 'settings' : 'categories' }, fromSettings ? 'back' : 'forward')
          }
          onBack={() =>
            navigate({ type: 'goto', phase: fromSettings ? 'settings' : 'home' }, 'back')
          }
          continueLabel={fromSettings ? 'done' : 'continue'}
        />
      )
    }

    case 'categories':
      return (
        <CategoriesScreen
          selected={state.selectedCategoryIds}
          onToggle={(id) => dispatch({ type: 'toggleCategory', id })}
          onContinue={() => navigate({ type: 'openSettings', origin: 'categories' })}
          onBack={() => navigate({ type: 'goto', phase: 'home' }, 'back')}
        />
      )

    case 'settings': {
      const fromHome = state.settingsOrigin === 'home'
      return (
        <SettingsScreen
          settings={state.settings}
          players={state.players}
          categoryCount={state.selectedCategoryIds.length}
          install={install}
          origin={state.settingsOrigin}
          onChange={(s) => dispatch({ type: 'setSettings', settings: s })}
          onEditPlayers={() => navigate({ type: 'openPlayers', origin: 'settings' })}
          onBack={() => navigate({ type: 'goto', phase: fromHome ? 'home' : 'categories' }, 'back')}
          onStart={() => navigate({ type: 'startRound', words: bundle.words })}
        />
      )
    }

    case 'handoff': {
      if (!state.round) return null
      const i = state.cursor
      return (
        <HandoffScreen
          name={state.players[i]}
          index={i}
          total={state.players.length}
          variant="reveal"
          onContinue={() => navigate({ type: 'goto', phase: 'reveal' })}
          onAbort={() => navigate({ type: 'abortRound' }, 'back')}
        />
      )
    }

    case 'reveal': {
      if (!state.round) return null
      const i = state.cursor
      const isImposter = state.round.imposterIndices.includes(i)
      return (
        <RevealScreen
          playerName={state.players[i]}
          isImposter={isImposter}
          word={state.round.word}
          hint={state.round.hint}
          hintsEnabled={state.settings.hintsEnabled}
          onContinue={() => navigate({ type: 'advanceReveal' })}
          onAbort={() => navigate({ type: 'abortRound' }, 'back')}
        />
      )
    }

    case 'play': {
      if (!state.round) return null
      return (
        <PlayScreen
          totalSeconds={state.settings.roundSeconds}
          categoryId={state.round.categoryId}
          starterName={state.players[state.round.starterIndex]}
          onFinish={() => navigate({ type: 'finishPlay' })}
          onAbort={() => navigate({ type: 'abortRound' }, 'back')}
        />
      )
    }

    case 'voteHandoff': {
      if (!state.round) return null
      const i = state.cursor
      return (
        <HandoffScreen
          name={state.players[i]}
          index={i}
          total={state.players.length}
          variant="vote"
          onContinue={() => navigate({ type: 'goto', phase: 'vote' })}
          onAbort={() => navigate({ type: 'abortRound' }, 'back')}
        />
      )
    }

    case 'vote': {
      if (!state.round) return null
      if (state.settings.voteMode === 'group') {
        return (
          <GroupVoteScreen
            players={state.players}
            onConfirm={(target) => navigate({ type: 'castGroupVote', target })}
          />
        )
      }
      const i = state.cursor
      const candidates = state.round.tieRevoteAmong ?? state.players.map((_, idx) => idx)
      return (
        <VoteScreen
          voterName={state.players[i]}
          voterIndex={i}
          players={state.players}
          candidateIndices={candidates}
          onConfirm={(target) => navigate({ type: 'castVote', voter: i, target })}
        />
      )
    }

    case 'result': {
      if (!state.round || !state.resultMostVoted || state.resultMostVoted.length === 0) {
        // Edge case: nobody got a vote (shouldn't happen — every voter must select).
        // Fall back to round-end with imposter as winner.
        if (state.round) {
          const imposterNames = state.round.imposterIndices.map((idx) => state.players[idx])
          return (
            <RoundEndScreen
              winner={state.winner ?? 'imposter'}
              word={state.round.word}
              imposterNames={imposterNames}
              onPlayAgain={() => navigate({ type: 'startRound', words: bundle.words })}
              onHome={() => navigate({ type: 'reset' }, 'back')}
            />
          )
        }
        return null
      }
      const eliminated = state.resultMostVoted[0]
      const wasImposter = state.round.imposterIndices.includes(eliminated)
      const imposterNames = state.round.imposterIndices.map((idx) => state.players[idx])
      return (
        <ResultScreen
          eliminatedName={state.players[eliminated]}
          imposterNames={imposterNames}
          wasImposter={wasImposter}
          onContinue={() => {
            if (wasImposter) {
              navigate({ type: 'goto', phase: 'imposterGuess' })
            } else {
              navigate({ type: 'goto', phase: 'roundEnd' })
            }
          }}
        />
      )
    }

    case 'imposterGuess': {
      if (!state.round || !state.resultMostVoted || state.resultMostVoted.length === 0) return null
      const eliminated = state.resultMostVoted[0]
      return (
        <ImposterGuessScreen
          imposterName={state.players[eliminated]}
          words={state.round.categoryWords}
          onGuess={(word) => navigate({ type: 'imposterGuess', word })}
        />
      )
    }

    case 'roundEnd': {
      if (!state.round || !state.winner) return null
      const imposterNames = state.round.imposterIndices.map((idx) => state.players[idx])
      return (
        <RoundEndScreen
          winner={state.winner}
          word={state.round.word}
          imposterNames={imposterNames}
          onPlayAgain={() => navigate({ type: 'startRound', words: bundle.words })}
          onHome={() => navigate({ type: 'reset' }, 'back')}
        />
      )
    }

    default:
      return <div className="p-6">Unknown phase: {state.phase}</div>
  }
}

export default function App() {
  return (
    <LocaleProvider>
      <Game />
    </LocaleProvider>
  )
}
