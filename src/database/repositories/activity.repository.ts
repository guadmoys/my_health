import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { ActivityLog } from '../types'

class ActivityRepository {
  async getByDate(date: string): Promise<ActivityLog[]> {
    return db.activityLogs.where('date').equals(date).toArray()
  }

  async getRange(from: string, to: string): Promise<ActivityLog[]> {
    const list = await db.activityLogs.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async add(log: ActivityLog): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.activityLogs.add(log)
      await recalculateDailyStats(db, log.date)
    })
  }

  async delete(id: string): Promise<void> {
    const log = await db.activityLogs.get(id)
    if (!log) return
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.activityLogs.delete(id)
      await recalculateDailyStats(db, log.date)
    })
  }
}

export const activityRepository = new ActivityRepository()
