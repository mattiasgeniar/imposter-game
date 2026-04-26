import { describe, expect, it } from 'vitest'
import { formatTime } from './format'

describe('formatTime', () => {
  it('formats zero as 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('pads seconds below 10', () => {
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(65)).toBe('1:05')
  })

  it('formats whole minutes', () => {
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(120)).toBe('2:00')
    expect(formatTime(600)).toBe('10:00')
  })

  it('formats mixed minute/second values', () => {
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(599)).toBe('9:59')
  })
})
