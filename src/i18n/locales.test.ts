import { afterEach, describe, expect, it } from 'vitest'
import { detectLocale } from './locales'

const ORIGINAL_LANGUAGE = navigator.language

function setLanguage(value: string) {
  Object.defineProperty(navigator, 'language', { value, configurable: true })
}

afterEach(() => {
  setLanguage(ORIGINAL_LANGUAGE)
})

describe('detectLocale', () => {
  it('returns nl-BE when navigator.language starts with "nl"', () => {
    setLanguage('nl-BE')
    expect(detectLocale()).toBe('nl-BE')
  })

  it('returns nl-BE for plain "nl"', () => {
    setLanguage('nl')
    expect(detectLocale()).toBe('nl-BE')
  })

  it('returns nl-BE for nl-NL (any Dutch variant maps to nl-BE)', () => {
    setLanguage('nl-NL')
    expect(detectLocale()).toBe('nl-BE')
  })

  it('is case-insensitive on the language tag', () => {
    setLanguage('NL-be')
    expect(detectLocale()).toBe('nl-BE')
  })

  it('falls back to en for any non-Dutch locale', () => {
    setLanguage('en-US')
    expect(detectLocale()).toBe('en')
    setLanguage('fr-FR')
    expect(detectLocale()).toBe('en')
    setLanguage('de-DE')
    expect(detectLocale()).toBe('en')
  })
})
