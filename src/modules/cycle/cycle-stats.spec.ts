import { describe, expect, it } from 'vitest'

import type { CycleLog } from '@/database/types'

import { computeCycleStats, isWithinFertileWindow } from './cycle-stats'

function flowLog(date: string): CycleLog {
  return { id: date, date, flow: 'medium' }
}

describe('computeCycleStats', () => {
  it('reports nothing when no periods are logged', () => {
    const stats = computeCycleStats([], '2026-03-01')
    expect(stats.periodStarts).toEqual([])
    expect(stats.avgCycleLengthDays).toBeUndefined()
    expect(stats.predictedNextPeriod).toBeUndefined()
  })

  it('detects a single period start and the current cycle day, but makes no prediction yet', () => {
    // One 4-day period starting 2026-03-01.
    const logs = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'].map(flowLog)
    const stats = computeCycleStats(logs, '2026-03-10')

    expect(stats.periodStarts).toEqual(['2026-03-01'])
    expect(stats.avgPeriodLengthDays).toBe(4)
    expect(stats.currentCycleDay).toBe(10) // March 1 is day 1, March 10 is day 10
    // Can't estimate a cycle length from a single period.
    expect(stats.avgCycleLengthDays).toBeUndefined()
    expect(stats.predictedNextPeriod).toBeUndefined()
  })

  it('estimates cycle length, next period, ovulation and fertile window from two periods', () => {
    // Period 1: Jan 1-4. Period 2: Jan 29 - Feb 1 (28-day cycle).
    const logs = [
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-29',
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
    ].map(flowLog)
    const stats = computeCycleStats(logs, '2026-02-05')

    expect(stats.periodStarts).toEqual(['2026-01-01', '2026-01-29'])
    expect(stats.avgCycleLengthDays).toBe(28)
    expect(stats.avgPeriodLengthDays).toBe(4)
    // Next period predicted 28 days after the last start (Jan 29 -> Feb 26).
    expect(stats.predictedNextPeriod).toBe('2026-02-26')
    // Ovulation ~14 days before that.
    expect(stats.ovulationEstimate).toBe('2026-02-12')
    expect(stats.fertileWindowStart).toBe('2026-02-07')
    expect(stats.fertileWindowEnd).toBe('2026-02-13')
  })

  it('isWithinFertileWindow reflects the computed window', () => {
    const logs = [
      '2026-01-01',
      '2026-01-02',
      '2026-01-29',
      '2026-01-30',
    ].map(flowLog)
    const stats = computeCycleStats(logs, '2026-02-05')

    expect(isWithinFertileWindow(stats, stats.fertileWindowStart!)).toBe(true)
    expect(isWithinFertileWindow(stats, stats.fertileWindowEnd!)).toBe(true)
    expect(isWithinFertileWindow(stats, '2026-01-01')).toBe(false)
  })
})
