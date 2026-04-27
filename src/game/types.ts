export type Locale = 'nl-BE' | 'en'

export type Settings = {
  imposterCount: number
  roundSeconds: number
  hintsEnabled: boolean
}

export type CategoryWord = { word: string; hint: string }

export type Round = {
  categoryId: string
  categoryWords: CategoryWord[]
  word: string
  hint: string
  imposterIndices: number[]
  votes: (number | null)[]
  tieRevoteAmong: number[] | null
}

export type Phase =
  | 'home'
  | 'players'
  | 'categories'
  | 'settings'
  | 'handoff'
  | 'reveal'
  | 'play'
  | 'voteHandoff'
  | 'vote'
  | 'result'
  | 'imposterGuess'
  | 'roundEnd'

export type Winner = 'crew' | 'imposter'

export type GameState = {
  phase: Phase
  players: string[]
  selectedCategoryIds: string[]
  settings: Settings
  cursor: number
  round: Round | null
  resultMostVoted: number[] | null
  winner: Winner | null
  /** ISO date (YYYY-MM-DD) of the most recent round, or null if never played. */
  lastPlayed: string | null
  /**
   * Where the players screen was opened from, so its back/continue buttons
   * route correctly. 'home' is the new-round flow → continue advances to
   * categories; 'settings' is the manual edit flow → continue returns to settings.
   */
  playersOrigin: 'home' | 'settings'
}
