import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectIOS, detectMobile, detectStandalone } from './install'

const ORIGINAL_UA = navigator.userAgent
const ORIGINAL_PLATFORM = navigator.platform
const ORIGINAL_MAX_TOUCH = navigator.maxTouchPoints

function setNavigator(props: {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
}) {
  if (props.userAgent !== undefined) {
    Object.defineProperty(navigator, 'userAgent', { value: props.userAgent, configurable: true })
  }
  if (props.platform !== undefined) {
    Object.defineProperty(navigator, 'platform', { value: props.platform, configurable: true })
  }
  if (props.maxTouchPoints !== undefined) {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: props.maxTouchPoints, configurable: true })
  }
}

afterEach(() => {
  setNavigator({
    userAgent: ORIGINAL_UA,
    platform: ORIGINAL_PLATFORM,
    maxTouchPoints: ORIGINAL_MAX_TOUCH,
  })
  vi.restoreAllMocks()
})

describe('detectIOS', () => {
  it('matches iPhone user agents', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    expect(detectIOS()).toBe(true)
  })

  it('matches iPad user agents', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPad',
      maxTouchPoints: 5,
    })
    expect(detectIOS()).toBe(true)
  })

  it('matches modern iPadOS that disguises itself as MacIntel + touch', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    })
    expect(detectIOS()).toBe(true)
  })

  it('does not match a real Mac (MacIntel without touch)', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    expect(detectIOS()).toBe(false)
  })

  it('does not match a desktop Chrome on Windows', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      platform: 'Win32',
      maxTouchPoints: 0,
    })
    expect(detectIOS()).toBe(false)
  })
})

describe('detectMobile', () => {
  it('is true for Android Chrome', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    })
    expect(detectMobile()).toBe(true)
  })

  it('is true on iPhone', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    expect(detectMobile()).toBe(true)
  })

  it('is false for desktop Chrome on macOS', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    expect(detectMobile()).toBe(false)
  })

  it('is false for desktop Chrome on Windows', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      platform: 'Win32',
      maxTouchPoints: 0,
    })
    expect(detectMobile()).toBe(false)
  })

  it('is false for desktop Firefox on Linux', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      platform: 'Linux x86_64',
      maxTouchPoints: 0,
    })
    expect(detectMobile()).toBe(false)
  })
})

describe('detectStandalone', () => {
  it('is true when display-mode: standalone matches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)
    expect(detectStandalone()).toBe(true)
  })

  it('is true when iOS reports navigator.standalone', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    expect(detectStandalone()).toBe(true)
    Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true })
  })

  it('is false in a regular browser tab', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)
    expect(detectStandalone()).toBe(false)
  })
})
