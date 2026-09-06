import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { WaterLog } from '../types'

class WaterRepository {
  async getByDate(date: string): Promise<WaterLog[]> {
    return db.waterLogs.where('date').equals(date).toArray()
  }

  async getDailyTotal(date: string): Promise<number> {
    const logs = await this.getByDate(date)
    return logs.reduce((sum, l) => sum + l.amountMl, 0)
  }

  async add(log: WaterLog): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.waterLogs.add(log)
      await recalculateDailyStats(db, log.date)
    })
  }

  async delete(id: string): Promise<void> {
    const log = await db.waterLogs.get(id)
    if (!log) return
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.waterLogs.delete(id)
      await recalculateDailyStats(db, log.date)
    })
  }
}

export const waterRepository = new WaterRepository()
