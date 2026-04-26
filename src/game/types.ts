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
}
