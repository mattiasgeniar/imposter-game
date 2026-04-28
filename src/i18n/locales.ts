import type { CategoryWord, Locale } from '../game/types'

export type CategoryMeta = { name: string; description: string; emoji: string }

export type LocaleBundle = {
  ui: Record<string, string>
  categories: Record<string, CategoryMeta>
  words: Record<string, CategoryWord[]>
}

export const AVAILABLE_LOCALES: { code: Locale; label: string }[] = [
  { code: 'nl-BE', label: 'Vlaams' },
  { code: 'en', label: 'English' },
]

export const CATEGORY_IDS = [
  'party',
  'food',
  'celebrities',
  'hobbies',
  'family',
  'brands',
  'places',
  'buildings',
  'animals',
  'sports',
  'films',
  'tvshows',
  'music',
  'jobs',
  'technology',
  'videogames',
  'superheroes',
  'mythical',
  'spicy',
] as const

export async function loadLocaleBundle(locale: Locale): Promise<LocaleBundle> {
  const ui = (await import(`../locales/${locale}/ui.json`)).default as Record<string, string>
  const categories = (await import(`../locales/${locale}/categories.json`)).default as Record<string, CategoryMeta>
  const wordEntries = await Promise.all(
    CATEGORY_IDS.map(async (id) => {
      const list = (await import(`../locales/${locale}/words/${id}.json`)).default as CategoryWord[]
      return [id, list] as const
    }),
  )
  return { ui, categories, words: Object.fromEntries(wordEntries) }
}

export function detectLocale(): Locale {
  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'nl-BE'
  if (lang.toLowerCase().startsWith('nl')) return 'nl-BE'
  return 'en'
}
