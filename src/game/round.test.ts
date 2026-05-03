import { afterEach, describe, expect, it, vi } from 'vitest'
import { startRound, tallyVotes } from './round'
import type { CategoryWord, Settings } from './types'

const SETTINGS: Settings = { imposterCount: 1, roundSeconds: 120, roundSecondsCustom: true, hintsEnabled: true, voteMode: 'individual' }

const SAMPLE_WORDS: Record<string, CategoryWord[]> = {
  party: [
    { word: 'Pizza', hint: 'Italian' },
    { word: 'Bingo', hint: 'Numbers' },
  ],
  food: [
    { word: 'Sushi', hint: 'Japanese' },
  ],
  empty: [],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('tallyVotes', () => {
  it('returns empty array when no votes were cast', () => {
    expect(tallyVotes([null, null, null], null)).toEqual([])
  })

  it('returns the single most-voted index', () => {
    expect(tallyVotes([1, 1, 0, 1], null)).toEqual([1])
  })

  it('returns all tied indices when multiple share the max', () => {
    expect(tallyVotes([1, 0, 1, 0], null)).toEqual([0, 1])
  })

  it('ignores null votes', () => {
    expect(tallyVotes([null, 2, null, 2, 0], null)).toEqual([2])
  })

  it('respects restrictTo and ignores votes outside it', () => {
    // votes: 0,0,1,2 — without restriction 0 wins. With restrictTo=[1,2] both 1 and 2 tie at 1 each.
    expect(tallyVotes([0, 0, 1, 2], [1, 2])).toEqual([1, 2])
  })

  it('returns empty when restrictTo filters out every vote', () => {
    expect(tallyVotes([0, 0, 1, 1], [99])).toEqual([])
  })
})

describe('startRound', () => {
  it('returns null when no selected category has any words', () => {
    expect(startRound(['A', 'B', 'C'], ['empty'], SAMPLE_WORDS, SETTINGS)).toBeNull()
  })

  it('returns null when selected category id is unknown', () => {
    expect(startRound(['A', 'B', 'C'], ['nope'], SAMPLE_WORDS, SETTINGS)).toBeNull()
  })

  it('returns null when no categories are selected', () => {
    expect(startRound(['A', 'B', 'C'], [], SAMPLE_WORDS, SETTINGS)).toBeNull()
  })

  it('only picks from categories that actually have words', () => {
    // 'empty' has zero words — must always pick 'food'
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C'], ['empty', 'food'], SAMPLE_WORDS, SETTINGS)
    expect(r).not.toBeNull()
    expect(r!.categoryId).toBe('food')
    expect(r!.word).toBe('Sushi')
  })

  it('snapshots the chosen category word list onto the round', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C'], ['party'], SAMPLE_WORDS, SETTINGS)!
    expect(r.categoryWords).toEqual(SAMPLE_WORDS.party)
  })

  it('clamps imposter count to at least 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C'], ['party'], SAMPLE_WORDS, { ...SETTINGS, imposterCount: 0 })!
    expect(r.imposterIndices).toHaveLength(1)
  })

  it('clamps imposter count to playerCount - 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C'], ['party'], SAMPLE_WORDS, { ...SETTINGS, imposterCount: 99 })!
    expect(r.imposterIndices).toHaveLength(2)
  })

  it('initializes empty votes for every player', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C', 'D'], ['party'], SAMPLE_WORDS, SETTINGS)!
    expect(r.votes).toEqual([null, null, null, null])
    expect(r.tieRevoteAmong).toBeNull()
  })

  it('produces a valid Round shape', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C'], ['party'], SAMPLE_WORDS, SETTINGS)!
    expect(r.imposterIndices.every((i) => i >= 0 && i < 3)).toBe(true)
    // Sorted ascending
    expect(r.imposterIndices).toEqual([...r.imposterIndices].sort((a, b) => a - b))
    expect(r.word.length).toBeGreaterThan(0)
  })

  it('picks a starterIndex within the player range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = startRound(['A', 'B', 'C', 'D'], ['party'], SAMPLE_WORDS, SETTINGS)!
    expect(r.starterIndex).toBeGreaterThanOrEqual(0)
    expect(r.starterIndex).toBeLessThan(4)
  })
})
