import type { Locale, Settings } from './types'
import { CATEGORY_IDS } from '../i18n/locales'

const KEYS = {
  players: 'imposter:players',
  categories: 'imposter:categories',
  settings: 'imposter:settings',
  locale: 'imposter:locale',
  lastPlayed: 'imposter:lastPlayed',
} as const

export function todayISO(now: Date = new Date()): string {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const RECOMMENDED_SECONDS_PER_PLAYER = 30
const ROUND_TIME_MIN = 30
const ROUND_TIME_MAX = 600

/**
 * The per-player recommendation, snapped into the valid stepper range. Used as
 * the default round time until the host explicitly adjusts the stepper.
 */
export function recommendedRoundSeconds(playerCount: number): number {
  const raw = Math.max(0, playerCount) * RECOMMENDED_SECONDS_PER_PLAYER
  return Math.max(ROUND_TIME_MIN, Math.min(ROUND_TIME_MAX, raw))
}

export const DEFAULT_SETTINGS: Settings = {
  imposterCount: 1,
  // Replaced by recommendedRoundSeconds(playerCount) in initialState/clampSettings
  // unless the host has set roundSecondsCustom = true.
  roundSeconds: recommendedRoundSeconds(0),
  roundSecondsCustom: false,
  hintsEnabled: true,
  voteMode: 'group',
}

function safeGet(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadPlayers(): string[] {
  const v = safeGet(KEYS.players)
  if (!Array.isArray(v)) return []
  return v.filter((s): s is string => typeof s === 'string')
}
export function savePlayers(players: string[]) { safeSet(KEYS.players, players) }

const KNOWN_CATEGORIES = new Set<string>(CATEGORY_IDS)

export function loadCategories(): string[] {
  const v = safeGet(KEYS.categories)
  if (!Array.isArray(v)) return []
  return v.filter((s): s is string => typeof s === 'string' && KNOWN_CATEGORIES.has(s))
}
export function saveCategories(ids: string[]) { safeSet(KEYS.categories, ids) }

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.round(value)))
}

// Pre-migration default — anything else stored is treated as a deliberate
// host override so we don't trample existing custom round lengths.
const LEGACY_DEFAULT_ROUND_SECONDS = 180

export function loadSettings(): Settings {
  const v = safeGet(KEYS.settings) as Partial<Settings> | undefined
  const roundSeconds = clampNumber(v?.roundSeconds, DEFAULT_SETTINGS.roundSeconds, ROUND_TIME_MIN, ROUND_TIME_MAX)
  const roundSecondsCustom = typeof v?.roundSecondsCustom === 'boolean'
    ? v.roundSecondsCustom
    : v?.roundSeconds !== undefined && roundSeconds !== LEGACY_DEFAULT_ROUND_SECONDS
  return {
    imposterCount: clampNumber(v?.imposterCount, DEFAULT_SETTINGS.imposterCount, 1, 99),
    roundSeconds,
    roundSecondsCustom,
    hintsEnabled: typeof v?.hintsEnabled === 'boolean' ? v.hintsEnabled : DEFAULT_SETTINGS.hintsEnabled,
    voteMode: v?.voteMode === 'group' || v?.voteMode === 'individual'
      ? v.voteMode
      : DEFAULT_SETTINGS.voteMode,
  }
}
export function saveSettings(s: Settings) { safeSet(KEYS.settings, s) }

export function loadLocale(): Locale | null {
  const v = safeGet(KEYS.locale)
  if (v === 'nl-BE' || v === 'en') return v
  return null
}
export function saveLocale(locale: Locale) { safeSet(KEYS.locale, locale) }

export function loadLastPlayed(): string | null {
  const v = safeGet(KEYS.lastPlayed)
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}
export function saveLastPlayed(date: string) { safeSet(KEYS.lastPlayed, date) }
