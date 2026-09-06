import { db } from '../db'
import type { WellbeingLog } from '../types'

class WellbeingRepository {
  async getByDate(date: string): Promise<WellbeingLog | undefined> {
    return db.wellbeingLogs.where('date').equals(date).first()
  }

  async getRange(from: string, to: string): Promise<WellbeingLog[]> {
    const list = await db.wellbeingLogs.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async upsertForDate(log: WellbeingLog): Promise<void> {
    const existing = await this.getByDate(log.date)
    if (existing) {
      await db.wellbeingLogs.update(existing.id, log)
    } else {
      await db.wellbeingLogs.add(log)
    }
  }
}

export const wellbeingRepository = new WellbeingRepository()
