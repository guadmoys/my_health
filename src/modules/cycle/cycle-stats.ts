import dayjs from 'dayjs'

import type { CycleLog } from '@/database/types'
import { DATE_FORMAT } from '@/utils/date'

export interface CycleStats {
  /** Detected start date of every logged period, ascending. */
  periodStarts: string[]
  avgCycleLengthDays?: number
  avgPeriodLengthDays?: number
  /** 1-indexed day within the current cycle, if at least one period is logged. */
  currentCycleDay?: number
  /** All of the below are calendar estimates from the user's own history — not a diagnosis. */
  predictedNextPeriod?: string
  ovulationEstimate?: string
  fertileWindowStart?: string
  fertileWindowEnd?: string
}

const LUTEAL_PHASE_DAYS = 14
const FERTILE_WINDOW_BEFORE_OVULATION = 5
const FERTILE_WINDOW_AFTER_OVULATION = 1

/**
 * Plain calendar-based estimates computed from the user's own logged period
 * days — the same kind of transparent local rule as the rest of the app's
 * rule engine (§24), not a medical prediction. Needs at least two logged
 * periods before it can estimate a cycle length; until then it only reports
 * the current cycle day.
 */
export function computeCycleStats(logs: CycleLog[], today: string): CycleStats {
  const flowDates = new Set(logs.filter((l) => l.flow).map((l) => l.date))
  const sortedFlowDates = [...flowDates].sort()
  if (!sortedFlowDates.length) return { periodStarts: [] }

  const periodStarts = sortedFlowDates.filter((date) => {
    const prevDay = dayjs(date).subtract(1, 'day').format(DATE_FORMAT)
    return !flowDates.has(prevDay)
  })

  const periodLengths = periodStarts.map((start) => {
    let length = 0
    let cursor = start
    while (flowDates.has(cursor)) {
      length++
      cursor = dayjs(cursor).add(1, 'day').format(DATE_FORMAT)
    }
    return length
  })

  const cycleLengths: number[] = []
  for (let i = 1; i < periodStarts.length; i++) {
    cycleLengths.push(dayjs(periodStarts[i]).diff(dayjs(periodStarts[i - 1]), 'day'))
  }

  const avgCycleLengthDays = cycleLengths.length
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : undefined
  const avgPeriodLengthDays = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : undefined

  const lastStart = periodStarts.at(-1)
  const currentCycleDay = lastStart ? dayjs(today).diff(dayjs(lastStart), 'day') + 1 : undefined

  const stats: CycleStats = { periodStarts, avgCycleLengthDays, avgPeriodLengthDays, currentCycleDay }

  if (lastStart && avgCycleLengthDays) {
    const predictedNextPeriod = dayjs(lastStart).add(avgCycleLengthDays, 'day').format(DATE_FORMAT)
    const ovulationEstimate = dayjs(predictedNextPeriod).subtract(LUTEAL_PHASE_DAYS, 'day').format(DATE_FORMAT)
    stats.predictedNextPeriod = predictedNextPeriod
    stats.ovulationEstimate = ovulationEstimate
    stats.fertileWindowStart = dayjs(ovulationEstimate).subtract(FERTILE_WINDOW_BEFORE_OVULATION, 'day').format(DATE_FORMAT)
    stats.fertileWindowEnd = dayjs(ovulationEstimate).add(FERTILE_WINDOW_AFTER_OVULATION, 'day').format(DATE_FORMAT)
  }

  return stats
}

export function isWithinFertileWindow(stats: CycleStats, date: string): boolean {
  if (!stats.fertileWindowStart || !stats.fertileWindowEnd) return false
  return date >= stats.fertileWindowStart && date <= stats.fertileWindowEnd
}
