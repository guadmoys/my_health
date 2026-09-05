import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { BodyMeasurement, WeightLog } from '../types'

class WeightRepository {
  async getRange(from: string, to: string): Promise<WeightLog[]> {
    const list = await db.weights.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async getAll(): Promise<WeightLog[]> {
    const list = await db.weights.toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async add(log: WeightLog): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.weights.add(log)
      await recalculateDailyStats(db, log.date)
    })
  }

  async delete(id: string): Promise<void> {
    const log = await db.weights.get(id)
    if (!log) return
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.weights.delete(id)
      await recalculateDailyStats(db, log.date)
    })
  }

  async addMeasurement(measurement: BodyMeasurement): Promise<void> {
    await db.bodyMeasurements.add(measurement)
  }

  async getMeasurements(type: BodyMeasurement['type']): Promise<BodyMeasurement[]> {
    const list = await db.bodyMeasurements.where('type').equals(type).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }
}

export const weightRepository = new WeightRepository()
