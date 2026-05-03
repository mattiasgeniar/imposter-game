import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  loadCategories,
  loadLastPlayed,
  loadLocale,
  loadPlayers,
  loadSettings,
  saveCategories,
  saveLastPlayed,
  saveLocale,
  savePlayers,
  saveSettings,
  todayISO,
} from './persistence'

beforeEach(() => {
  localStorage.clear()
})

describe('loadPlayers', () => {
  it('returns an empty array by default', () => {
    expect(loadPlayers()).toEqual([])
  })

  it('round-trips a saved list', () => {
    savePlayers(['Tuur', 'Floor'])
    expect(loadPlayers()).toEqual(['Tuur', 'Floor'])
  })

  it('strips non-string entries', () => {
    localStorage.setItem('imposter:players', JSON.stringify(['Tuur', 42, null, 'Floor']))
    expect(loadPlayers()).toEqual(['Tuur', 'Floor'])
  })

  it('returns empty array on malformed JSON', () => {
    localStorage.setItem('imposter:players', '{not json')
    expect(loadPlayers()).toEqual([])
  })
})

describe('loadCategories', () => {
  it('filters out unknown category ids', () => {
    saveCategories(['party', 'unknown', 'food'])
    expect(loadCategories()).toEqual(['party', 'food'])
  })

  it('returns empty array on non-array storage value', () => {
    localStorage.setItem('imposter:categories', JSON.stringify({ not: 'array' }))
    expect(loadCategories()).toEqual([])
  })
})

describe('loadSettings', () => {
  it('returns defaults when nothing stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips valid settings', () => {
    saveSettings({ imposterCount: 2, roundSeconds: 240, roundSecondsCustom: true, hintsEnabled: false, voteMode: 'group' })
    expect(loadSettings()).toEqual({ imposterCount: 2, roundSeconds: 240, roundSecondsCustom: true, hintsEnabled: false, voteMode: 'group' })
  })

  it('clamps roundSeconds to the valid 30..600 range', () => {
    saveSettings({ imposterCount: 1, roundSeconds: 9999, roundSecondsCustom: true, hintsEnabled: true, voteMode: 'individual' })
    expect(loadSettings().roundSeconds).toBe(600)

    saveSettings({ imposterCount: 1, roundSeconds: -50, roundSecondsCustom: true, hintsEnabled: true, voteMode: 'individual' })
    expect(loadSettings().roundSeconds).toBe(30)
  })

  it('treats a stored 180 (the legacy default) as not custom for backward compat', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 180, hintsEnabled: true, voteMode: 'group' }),
    )
    expect(loadSettings().roundSecondsCustom).toBe(false)
  })

  it('infers custom=true when a stored roundSeconds differs from the legacy default', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 240, hintsEnabled: true, voteMode: 'group' }),
    )
    expect(loadSettings().roundSecondsCustom).toBe(true)
  })

  it('respects an explicit roundSecondsCustom flag over the legacy heuristic', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 240, roundSecondsCustom: false, hintsEnabled: true, voteMode: 'group' }),
    )
    expect(loadSettings().roundSecondsCustom).toBe(false)
  })

  it('falls back to group when voteMode is missing or invalid', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 120, hintsEnabled: true, voteMode: 'huh' }),
    )
    expect(loadSettings().voteMode).toBe('group')
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 1, roundSeconds: 120, hintsEnabled: true }),
    )
    expect(loadSettings().voteMode).toBe('group')
  })

  it('round-trips an individual voteMode', () => {
    saveSettings({ imposterCount: 1, roundSeconds: 120, roundSecondsCustom: true, hintsEnabled: true, voteMode: 'individual' })
    expect(loadSettings().voteMode).toBe('individual')
  })

  it('rejects non-finite numeric values and falls back to defaults', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: NaN, roundSeconds: 'oops', hintsEnabled: 'yes' }),
    )
    const s = loadSettings()
    expect(s.imposterCount).toBe(DEFAULT_SETTINGS.imposterCount)
    expect(s.roundSeconds).toBe(DEFAULT_SETTINGS.roundSeconds)
    expect(s.hintsEnabled).toBe(DEFAULT_SETTINGS.hintsEnabled)
  })

  it('rounds fractional values', () => {
    localStorage.setItem(
      'imposter:settings',
      JSON.stringify({ imposterCount: 2.7, roundSeconds: 119.4, hintsEnabled: true }),
    )
    const s = loadSettings()
    expect(s.imposterCount).toBe(3)
    expect(s.roundSeconds).toBe(119)
  })
})

describe('todayISO', () => {
  it('formats year-month-day with zero padding', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses local time, not UTC', () => {
    // 23:30 local on Apr 27 is the 27th in local terms regardless of timezone offset.
    expect(todayISO(new Date(2026, 3, 27, 23, 30))).toBe('2026-04-27')
  })
})

describe('loadLastPlayed', () => {
  it('returns null when nothing stored', () => {
    expect(loadLastPlayed()).toBeNull()
  })

  it('round-trips a valid YYYY-MM-DD date', () => {
    saveLastPlayed('2026-04-27')
    expect(loadLastPlayed()).toBe('2026-04-27')
  })

  it('rejects malformed date strings', () => {
    localStorage.setItem('imposter:lastPlayed', JSON.stringify('yesterday'))
    expect(loadLastPlayed()).toBeNull()
    localStorage.setItem('imposter:lastPlayed', JSON.stringify('2026-4-27'))
    expect(loadLastPlayed()).toBeNull()
    localStorage.setItem('imposter:lastPlayed', JSON.stringify(20260427))
    expect(loadLastPlayed()).toBeNull()
  })
})

describe('loadLocale', () => {
  it('returns null when nothing stored', () => {
    expect(loadLocale()).toBeNull()
  })

  it('round-trips a valid locale', () => {
    saveLocale('en')
    expect(loadLocale()).toBe('en')
  })

  it('returns null for unrecognised values', () => {
    localStorage.setItem('imposter:locale', JSON.stringify('fr-FR'))
    expect(loadLocale()).toBeNull()
  })
})
