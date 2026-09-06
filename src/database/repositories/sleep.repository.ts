import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { SleepLog } from '../types'

class SleepRepository {
  async getRange(from: string, to: string): Promise<SleepLog[]> {
    const list = await db.sleepLogs.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async getByDate(date: string): Promise<SleepLog | undefined> {
    return db.sleepLogs.where('date').equals(date).first()
  }

  async add(log: SleepLog): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.sleepLogs.add(log)
      await recalculateDailyStats(db, log.date)
    })
  }

  async delete(id: string): Promise<void> {
    const log = await db.sleepLogs.get(id)
    if (!log) return
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.sleepLogs.delete(id)
      await recalculateDailyStats(db, log.date)
    })
  }
}

export const sleepRepository = new SleepRepository()
