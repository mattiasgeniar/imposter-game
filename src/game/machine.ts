import type { CategoryWord, GameState, Round, Settings, Winner } from './types'
import { startRound, tallyVotes } from './round'
import { loadCategories, loadLastPlayed, loadPlayers, loadSettings, recommendedRoundSeconds, saveLastPlayed, todayISO } from './persistence'

type Action =
  | { type: 'goto'; phase: GameState['phase'] }
  | { type: 'openPlayers'; origin: 'home' | 'settings' }
  | { type: 'openSettings'; origin: 'home' | 'categories' }
  | { type: 'addPlayer'; name: string }
  | { type: 'removePlayer'; index: number }
  | { type: 'toggleCategory'; id: string }
  | { type: 'setSettings'; settings: Settings }
  | { type: 'startRound'; words: Record<string, CategoryWord[]> }
  | { type: 'advanceReveal' }
  | { type: 'finishPlay' }
  | { type: 'castVote'; voter: number; target: number }
  | { type: 'castGroupVote'; target: number }
  | { type: 'imposterGuess'; word: string }
  | { type: 'reset' }
  | { type: 'abortRound' }

export type { Action }

function clampImposterCount(count: number, playerCount: number): number {
  if (playerCount < 3) return 1
  return Math.max(1, Math.min(count, playerCount - 1))
}

function clampSettings(settings: Settings, playerCount: number): Settings {
  return {
    ...settings,
    imposterCount: clampImposterCount(settings.imposterCount, playerCount),
    roundSeconds: settings.roundSecondsCustom
      ? settings.roundSeconds
      : recommendedRoundSeconds(playerCount),
  }
}

export function initialState(): GameState {
  const players = loadPlayers()
  return {
    phase: 'home',
    players,
    selectedCategoryIds: loadCategories(),
    settings: clampSettings(loadSettings(), players.length),
    cursor: 0,
    round: null,
    resultMostVoted: null,
    winner: null,
    lastPlayed: loadLastPlayed(),
    playersOrigin: 'home',
    settingsOrigin: 'home',
  }
}

export function arePlayersStale(state: Pick<GameState, 'players' | 'lastPlayed'>): boolean {
  if (state.players.length < 3) return true
  if (!state.lastPlayed) return true
  return state.lastPlayed !== todayISO()
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'goto':
      return { ...state, phase: action.phase }

    case 'openPlayers':
      return { ...state, phase: 'players', playersOrigin: action.origin }

    case 'openSettings':
      return { ...state, phase: 'settings', settingsOrigin: action.origin }

    case 'addPlayer': {
      const trimmed = action.name.trim()
      if (!trimmed) return state
      if (state.players.includes(trimmed)) return state
      const players = [...state.players, trimmed]
      return { ...state, players, settings: clampSettings(state.settings, players.length) }
    }

    case 'removePlayer': {
      const players = state.players.filter((_, i) => i !== action.index)
      return { ...state, players, settings: clampSettings(state.settings, players.length) }
    }

    case 'toggleCategory': {
      const has = state.selectedCategoryIds.includes(action.id)
      const next = has
        ? state.selectedCategoryIds.filter((i) => i !== action.id)
        : [...state.selectedCategoryIds, action.id]
      return { ...state, selectedCategoryIds: next }
    }

    case 'setSettings':
      return { ...state, settings: clampSettings(action.settings, state.players.length) }

    case 'startRound': {
      const round = startRound(state.players, state.selectedCategoryIds, action.words, state.settings)
      if (!round) return state
      const today = todayISO()
      saveLastPlayed(today)
      return {
        ...state,
        round,
        phase: 'handoff',
        cursor: 0,
        resultMostVoted: null,
        winner: null,
        lastPlayed: today,
      }
    }

    case 'advanceReveal': {
      if (!state.round) return state
      const nextCursor = state.cursor + 1
      if (nextCursor >= state.players.length) {
        return { ...state, phase: 'play', cursor: 0 }
      }
      return { ...state, phase: 'handoff', cursor: nextCursor }
    }

    case 'finishPlay':
      // Group mode skips per-player handoffs — the discussion already happened
      // out loud, so the group makes one collective pick on a shared screen.
      if (state.settings.voteMode === 'group') {
        return { ...state, phase: 'vote', cursor: 0 }
      }
      return { ...state, phase: 'voteHandoff', cursor: 0 }

    case 'castVote': {
      if (!state.round) return state
      // Reducer enforces invariants: only the player at the cursor may vote, and
      // only for a valid candidate. The screen filters the UI but should not be trusted.
      if (action.voter !== state.cursor) return state
      if (state.round.votes[action.voter] !== null) return state
      const candidates = state.round.tieRevoteAmong ?? state.players.map((_, i) => i)
      if (action.target === action.voter) return state
      if (!candidates.includes(action.target)) return state
      const votes = state.round.votes.slice()
      votes[action.voter] = action.target
      const nextVoter = action.voter + 1
      const round: Round = { ...state.round, votes }

      if (nextVoter < state.players.length) {
        return { ...state, round, phase: 'voteHandoff', cursor: nextVoter }
      }

      const top = tallyVotes(round.votes, round.tieRevoteAmong)

      // Nobody got a vote (defensive — shouldn't happen since every voter must select)
      if (top.length === 0) {
        return { ...state, round, resultMostVoted: [], winner: 'imposter', phase: 'result' }
      }

      // Tie
      if (top.length > 1) {
        if (round.tieRevoteAmong) {
          return { ...state, round, resultMostVoted: top, winner: 'imposter', phase: 'result' }
        }
        return {
          ...state,
          round: { ...round, tieRevoteAmong: top, votes: round.votes.map(() => null) },
          phase: 'voteHandoff',
          cursor: 0,
        }
      }

      // Single most-voted
      const eliminated = top[0]
      const isImposter = round.imposterIndices.includes(eliminated)
      const winner: Winner | null = isImposter ? null : 'imposter'
      return { ...state, round, resultMostVoted: top, winner, phase: 'result' }
    }

    case 'castGroupVote': {
      if (!state.round) return state
      if (action.target < 0 || action.target >= state.players.length) return state
      const isImposter = state.round.imposterIndices.includes(action.target)
      const winner: Winner | null = isImposter ? null : 'imposter'
      return {
        ...state,
        resultMostVoted: [action.target],
        winner,
        phase: 'result',
      }
    }

    case 'imposterGuess': {
      if (!state.round) return state
      const correct = action.word.toLocaleLowerCase() === state.round.word.toLocaleLowerCase()
      return { ...state, winner: correct ? 'imposter' : 'crew', phase: 'roundEnd' }
    }

    case 'reset':
      return { ...state, phase: 'home', round: null, resultMostVoted: null, winner: null, cursor: 0 }

    case 'abortRound':
      // Bail out mid-round (typically from the play screen). Drop the host on
      // settings with origin=categories so the Start button stays visible.
      return {
        ...state,
        phase: 'settings',
        settingsOrigin: 'categories',
        round: null,
        resultMostVoted: null,
        winner: null,
        cursor: 0,
      }

    default:
      return state
  }
}
