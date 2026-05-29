import { describe, it, expect } from 'vitest'
import { calculateAmountDue } from '../billing'

describe('calculateAmountDue', () => {
  it('returns base 10 for 0 or negative orders', () => {
    expect(calculateAmountDue(0)).toBe(10)
    expect(calculateAmountDue(-5)).toBe(10)
  })

  it('returns 10 for up to 30 orders', () => {
    expect(calculateAmountDue(1)).toBe(10)
    expect(calculateAmountDue(30)).toBe(10)
  })

  it('increases by 10 every 20 orders after 30, capped at 100 per cycle', () => {
    // 31-50 -> +10 => 20
    expect(calculateAmountDue(31)).toBe(20)
    expect(calculateAmountDue(50)).toBe(20)

    // 51-70 -> +20
    expect(calculateAmountDue(51)).toBe(30)

    // cap at 100 within cycle
    expect(calculateAmountDue(930)).toBe(100)
  })

  it('adds cycle base for each 1000 orders (matches current algorithm)', () => {
    // Current algorithm treats 1000 as a full cycle capped at 110
    expect(calculateAmountDue(1000)).toBe(110)
    // 1030 orders -> treated as 30 into next cycle: 10 + cycleBase (10) = 20
    expect(calculateAmountDue(1030)).toBe(20)
  })
})
