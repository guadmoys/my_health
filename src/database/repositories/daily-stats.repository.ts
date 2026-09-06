import { db } from '../db'
import type { DailyStats } from '../types'

/** Read-only access to precomputed daily aggregates (§27) — analytics reads only this, never raw logs. */
class DailyStatsRepository {
  async getByDate(date: string): Promise<DailyStats | undefined> {
    return db.dailyStats.get(date)
  }

  async getRange(from: string, to: string): Promise<DailyStats[]> {
    const list = await db.dailyStats.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }
}

export const dailyStatsRepository = new DailyStatsRepository()
