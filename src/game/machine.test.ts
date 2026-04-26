import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, reducer } from './machine'
import type { GameState, Round } from './types'

const WORDS = {
  party: [
    { word: 'Pizza', hint: 'Italian' },
    { word: 'Bingo', hint: 'Numbers' },
  ],
  food: [
    { word: 'Sushi', hint: 'Japanese' },
  ],
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function withRound(state: GameState, override: Partial<Round> = {}): GameState {
  // Helper: deterministically install a round on a state for vote-loop tests.
  const players = state.players
  const round: Round = {
    categoryId: 'party',
    categoryWords: WORDS.party,
    word: 'Pizza',
    hint: 'Italian',
    imposterIndices: [1],
    votes: players.map(() => null),
    tieRevoteAmong: null,
    ...override,
  }
  return { ...state, round, phase: 'voteHandoff', cursor: 0 }
}

function withPlayers(...names: string[]): GameState {
  let s = initialState()
  for (const name of names) s = reducer(s, { type: 'addPlayer', name })
  return s
}

describe('initialState', () => {
  it('starts on the home phase with empty progress state', () => {
    const s = initialState()
    expect(s.phase).toBe('home')
    expect(s.cursor).toBe(0)
    expect(s.round).toBeNull()
    expect(s.resultMostVoted).toBeNull()
    expect(s.winner).toBeNull()
  })

  it('hydrates players, categories, and settings from localStorage', () => {
    localStorage.setItem('imposter:players', JSON.stringify(['Tuur', 'Floor']))
    localStorage.setItem('imposter:categories', JSON.stringify(['party']))
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 90, hintsEnabled: false }),
    )
    const s = initialState()
    expect(s.players).toEqual(['Tuur', 'Floor'])
    expect(s.selectedCategoryIds).toEqual(['party'])
    expect(s.settings).toEqual({ imposterCount: 1, roundSeconds: 90, hintsEnabled: false })
  })

  it('clamps stored imposterCount that exceeds player count - 1', () => {
    localStorage.setItem('imposter:players', JSON.stringify(['A', 'B', 'C']))
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 10, roundSeconds: 120, hintsEnabled: true }),
    )
    expect(initialState().settings.imposterCount).toBe(2)
  })
})

describe('goto', () => {
  it('changes the current phase without touching anything else', () => {
    const s = withPlayers('A', 'B', 'C')
    const next = reducer(s, { type: 'goto', phase: 'settings' })
    expect(next.phase).toBe('settings')
    expect(next.players).toEqual(s.players)
    expect(next.cursor).toBe(s.cursor)
  })
})

describe('addPlayer', () => {
  it('adds a trimmed name', () => {
    const s = reducer(initialState(), { type: 'addPlayer', name: '  Tuur  ' })
    expect(s.players).toEqual(['Tuur'])
  })

  it('ignores empty / whitespace-only names', () => {
    const s = reducer(initialState(), { type: 'addPlayer', name: '   ' })
    expect(s.players).toEqual([])
  })

  it('ignores duplicate names', () => {
    const s1 = reducer(initialState(), { type: 'addPlayer', name: 'Tuur' })
    const s2 = reducer(s1, { type: 'addPlayer', name: 'Tuur' })
    expect(s2.players).toEqual(['Tuur'])
  })
})

describe('removePlayer', () => {
  it('removes by index', () => {
    const s = reducer(withPlayers('A', 'B', 'C'), { type: 'removePlayer', index: 1 })
    expect(s.players).toEqual(['A', 'C'])
  })

  it('clamps imposterCount when the new player count makes it impossible', () => {
    let s = withPlayers('A', 'B', 'C', 'D', 'E')
    s = reducer(s, { type: 'setSettings', settings: { ...s.settings, imposterCount: 4 } })
    expect(s.settings.imposterCount).toBe(4)

    // Drop down to 3 players → max imposters becomes 2
    s = reducer(s, { type: 'removePlayer', index: 0 })
    s = reducer(s, { type: 'removePlayer', index: 0 })
    expect(s.players).toHaveLength(3)
    expect(s.settings.imposterCount).toBe(2)
  })
})

describe('toggleCategory', () => {
  it('adds and removes a category id', () => {
    let s = initialState()
    s = reducer(s, { type: 'toggleCategory', id: 'party' })
    expect(s.selectedCategoryIds).toEqual(['party'])
    s = reducer(s, { type: 'toggleCategory', id: 'food' })
    expect(s.selectedCategoryIds).toEqual(['party', 'food'])
    s = reducer(s, { type: 'toggleCategory', id: 'party' })
    expect(s.selectedCategoryIds).toEqual(['food'])
  })
})

describe('setSettings', () => {
  it('clamps imposterCount to playerCount - 1', () => {
    const s = withPlayers('A', 'B', 'C')
    const next = reducer(s, { type: 'setSettings', settings: { ...s.settings, imposterCount: 99 } })
    expect(next.settings.imposterCount).toBe(2)
  })

  it('clamps imposterCount to a minimum of 1', () => {
    const s = withPlayers('A', 'B', 'C')
    const next = reducer(s, { type: 'setSettings', settings: { ...s.settings, imposterCount: -5 } })
    expect(next.settings.imposterCount).toBe(1)
  })
})

describe('startRound', () => {
  it('transitions to handoff with cursor 0 and stores the round', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const s0 = withPlayers('A', 'B', 'C')
    const s1 = reducer(s0, { type: 'toggleCategory', id: 'party' })
    const s2 = reducer(s1, { type: 'startRound', words: WORDS })
    expect(s2.phase).toBe('handoff')
    expect(s2.cursor).toBe(0)
    expect(s2.round).not.toBeNull()
    expect(s2.round!.categoryId).toBe('party')
  })

  it('clears prior round result and winner', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const s0 = withPlayers('A', 'B', 'C')
    const s1 = reducer(s0, { type: 'toggleCategory', id: 'party' })
    const stale: GameState = { ...s1, resultMostVoted: [0], winner: 'imposter' }
    const s2 = reducer(stale, { type: 'startRound', words: WORDS })
    expect(s2.resultMostVoted).toBeNull()
    expect(s2.winner).toBeNull()
  })

  it('is a no-op when no category has any words', () => {
    const s0 = withPlayers('A', 'B', 'C')
    const s1 = reducer(s0, { type: 'toggleCategory', id: 'food' })
    const s2 = reducer(s1, { type: 'startRound', words: { food: [] } })
    expect(s2).toBe(s1)
  })
})

describe('advanceReveal', () => {
  it('increments the cursor and goes back to handoff', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const s0 = withPlayers('A', 'B', 'C')
    const s1 = reducer(s0, { type: 'toggleCategory', id: 'party' })
    const s2 = reducer(s1, { type: 'startRound', words: WORDS })
    const s3 = reducer(s2, { type: 'advanceReveal' })
    expect(s3.phase).toBe('handoff')
    expect(s3.cursor).toBe(1)
  })

  it('moves to play once every player has revealed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const s0 = withPlayers('A', 'B', 'C')
    const s1 = reducer(s0, { type: 'toggleCategory', id: 'party' })
    let s = reducer(s1, { type: 'startRound', words: WORDS })
    s = reducer(s, { type: 'advanceReveal' })
    s = reducer(s, { type: 'advanceReveal' })
    s = reducer(s, { type: 'advanceReveal' })
    expect(s.phase).toBe('play')
    expect(s.cursor).toBe(0)
  })
})

describe('finishPlay', () => {
  it('moves to voteHandoff with cursor 0', () => {
    const s = withPlayers('A', 'B', 'C')
    const next = reducer({ ...s, phase: 'play' }, { type: 'finishPlay' })
    expect(next.phase).toBe('voteHandoff')
    expect(next.cursor).toBe(0)
  })
})

describe('castVote — invariant guards', () => {
  it('rejects a vote whose voter index is not the current cursor', () => {
    const s = withRound(withPlayers('A', 'B', 'C'))
    const next = reducer(s, { type: 'castVote', voter: 2, target: 1 })
    // cursor stayed at 0, no vote recorded
    expect(next).toBe(s)
  })

  it('rejects a vote when this voter already voted', () => {
    const base = withPlayers('A', 'B', 'C')
    const s = withRound(base, { votes: [1, null, null] })
    // cursor=0, voter 0 already has a vote in the array → rejected
    const next = reducer(s, { type: 'castVote', voter: 0, target: 2 })
    expect(next).toBe(s)
  })

  it('rejects a self-vote', () => {
    const s = withRound(withPlayers('A', 'B', 'C'))
    const next = reducer(s, { type: 'castVote', voter: 0, target: 0 })
    expect(next).toBe(s)
  })

  it('rejects a target outside the candidate list during a tie revote', () => {
    const s = withRound(withPlayers('A', 'B', 'C'), { tieRevoteAmong: [1, 2] })
    // voter 0 trying to vote for index 0 (not in tie set)
    const next = reducer(s, { type: 'castVote', voter: 0, target: 0 })
    expect(next).toBe(s)
  })
})

describe('castVote — round outcomes', () => {
  it('advances cursor and stays on voteHandoff while votes remain', () => {
    const s = withRound(withPlayers('A', 'B', 'C'))
    const s1 = reducer(s, { type: 'castVote', voter: 0, target: 1 })
    expect(s1.phase).toBe('voteHandoff')
    expect(s1.cursor).toBe(1)
    expect(s1.round!.votes).toEqual([1, null, null])
  })

  it('declares imposter winner when crew picks a non-imposter', () => {
    // imposter at index 1; everyone votes for player 0 (innocent)
    const s = withRound(withPlayers('A', 'B', 'C'))
    let next = reducer(s, { type: 'castVote', voter: 0, target: 2 })
    next = reducer(next, { type: 'castVote', voter: 1, target: 0 })
    next = reducer(next, { type: 'castVote', voter: 2, target: 0 })
    expect(next.phase).toBe('result')
    expect(next.resultMostVoted).toEqual([0])
    expect(next.winner).toBe('imposter')
  })

  it('leaves winner null when the imposter was caught (steal pending)', () => {
    // imposter at index 1; everyone votes for player 1
    const s = withRound(withPlayers('A', 'B', 'C'))
    let next = reducer(s, { type: 'castVote', voter: 0, target: 1 })
    next = reducer(next, { type: 'castVote', voter: 1, target: 2 })
    next = reducer(next, { type: 'castVote', voter: 2, target: 1 })
    expect(next.phase).toBe('result')
    expect(next.resultMostVoted).toEqual([1])
    expect(next.winner).toBeNull()
  })

  it('triggers a tie revote restricted to the tied players', () => {
    // 4 players, no current revote. Votes split 2-2 between players 1 and 2.
    const s = withRound(withPlayers('A', 'B', 'C', 'D'))
    let next = reducer(s, { type: 'castVote', voter: 0, target: 1 })
    next = reducer(next, { type: 'castVote', voter: 1, target: 2 })
    next = reducer(next, { type: 'castVote', voter: 2, target: 1 })
    next = reducer(next, { type: 'castVote', voter: 3, target: 2 })
    expect(next.phase).toBe('voteHandoff')
    expect(next.cursor).toBe(0)
    expect(next.round!.tieRevoteAmong).toEqual([1, 2])
    expect(next.round!.votes).toEqual([null, null, null, null])
  })

  it('declares imposters winner on a second tie', () => {
    const s = withRound(withPlayers('A', 'B', 'C', 'D'), { tieRevoteAmong: [1, 2] })
    let next = reducer(s, { type: 'castVote', voter: 0, target: 1 })
    next = reducer(next, { type: 'castVote', voter: 1, target: 2 })
    next = reducer(next, { type: 'castVote', voter: 2, target: 1 })
    next = reducer(next, { type: 'castVote', voter: 3, target: 2 })
    expect(next.phase).toBe('result')
    expect(next.winner).toBe('imposter')
    expect(next.resultMostVoted).toEqual([1, 2])
  })
})

describe('imposterGuess', () => {
  it('makes the imposter win on a correct guess (case-insensitive)', () => {
    const s = withRound(withPlayers('A', 'B', 'C'), { word: 'Pizza' })
    const next = reducer(s, { type: 'imposterGuess', word: 'pizza' })
    expect(next.winner).toBe('imposter')
    expect(next.phase).toBe('roundEnd')
  })

  it('makes the crew win on a wrong guess', () => {
    const s = withRound(withPlayers('A', 'B', 'C'), { word: 'Pizza' })
    const next = reducer(s, { type: 'imposterGuess', word: 'Bingo' })
    expect(next.winner).toBe('crew')
    expect(next.phase).toBe('roundEnd')
  })
})

describe('null-round guards', () => {
  it('advanceReveal is a no-op when no round is active', () => {
    const s = withPlayers('A', 'B', 'C')
    expect(reducer(s, { type: 'advanceReveal' })).toBe(s)
  })

  it('castVote is a no-op when no round is active', () => {
    const s = withPlayers('A', 'B', 'C')
    expect(reducer(s, { type: 'castVote', voter: 0, target: 1 })).toBe(s)
  })

  it('imposterGuess is a no-op when no round is active', () => {
    const s = withPlayers('A', 'B', 'C')
    expect(reducer(s, { type: 'imposterGuess', word: 'pizza' })).toBe(s)
  })
})

describe('reset', () => {
  it('returns to the home phase and clears in-progress round state', () => {
    const s = withRound(withPlayers('A', 'B', 'C'), { word: 'Pizza' })
    const dirty: GameState = { ...s, resultMostVoted: [0], winner: 'imposter' }
    const next = reducer(dirty, { type: 'reset' })
    expect(next.phase).toBe('home')
    expect(next.round).toBeNull()
    expect(next.resultMostVoted).toBeNull()
    expect(next.winner).toBeNull()
    expect(next.cursor).toBe(0)
    // Player list and settings survive reset
    expect(next.players).toEqual(['A', 'B', 'C'])
  })
})
