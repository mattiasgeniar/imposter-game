export type Locale = 'nl-BE' | 'en'

export type VoteMode = 'individual' | 'group'

export type Settings = {
  imposterCount: number
  roundSeconds: number
  /**
   * False until the host adjusts the round-time stepper. While false, roundSeconds
   * tracks the per-player recommendation as players are added/removed; once true,
   * the host's chosen value sticks across player-count changes.
   */
  roundSecondsCustom: boolean
  hintsEnabled: boolean
  /**
   * 'individual' (default): each player privately votes. Ties trigger a runoff.
   * 'group': a single collective decision — anyone taps the suspect, group confirms.
   */
  voteMode: VoteMode
}

export type CategoryWord = { word: string; hint: string }

export type Round = {
  categoryId: string
  categoryWords: CategoryWord[]
  word: string
  hint: string
  imposterIndices: number[]
  starterIndex: number
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
  /**
   * Where the settings screen was opened from. 'categories' is the setup
   * flow (Home → categories → settings) and shows a Start button. 'home' is
   * the manual prefs-tweak flow and hides Start, so the user can't bypass
   * the category-selection step.
   */
  settingsOrigin: 'home' | 'categories'
}
