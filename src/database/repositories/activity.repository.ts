import { createId } from '@/utils/id'

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

  /**
   * Steps are a running daily total re-entered as the count changes, not a
   * discrete session — so re-logging steps for a day replaces that day's
   * figure instead of stacking on top of it (unlike a walk/run/etc, which
   * are genuinely separate events and stay additive via `add`).
   */
  async upsertStepsForDate(date: string, value: number): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      const existing = (await db.activityLogs.where('date').equals(date).toArray()).find(
        (a) => a.type === 'steps',
      )
      if (existing) {
        await db.activityLogs.update(existing.id, { value })
      } else {
        await db.activityLogs.add({ id: createId(), date, type: 'steps', value })
      }
      await recalculateDailyStats(db, date)
    })
  }

  async hasAnySteps(): Promise<boolean> {
    return (await db.activityLogs.where('type').equals('steps').count()) > 0
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
