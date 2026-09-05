import dayjs from 'dayjs'

import { DATE_FORMAT, today } from './date'

export type Period = '7' | '30' | '90' | '365' | 'all'

export const periodOptions: { value: Period; label: string }[] = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
  { value: '365', label: 'Год' },
  { value: 'all', label: 'Всё время' },
]

export function periodRange(period: Period): { from: string; to: string } {
  const to = today()
  if (period === 'all') return { from: '1900-01-01', to }
  const days = Number(period)
  return { from: dayjs(to).subtract(days - 1, 'day').format(DATE_FORMAT), to }
}

/** The current Monday-start week, for the Weekly Review (§26). */
export function currentWeekRange(): { from: string; to: string } {
  const dow = dayjs().day() // 0 = Sunday
  const diffFromMonday = dow === 0 ? 6 : dow - 1
  return { from: dayjs().subtract(diffFromMonday, 'day').format(DATE_FORMAT), to: today() }
}

/** Trailing moving average — smooths day-to-day noise so a chart reads as a trend, not one data point (§17). */
export function movingAverage<T>(points: T[], getValue: (point: T) => number, window: number): number[] {
  return points.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = points.slice(start, index + 1)
    const sum = slice.reduce((acc, p) => acc + getValue(p), 0)
    return sum / slice.length
  })
}
