import { createId } from '@/utils/id'

import { db } from '../db'
import type { CycleLog } from '../types'

class CycleRepository {
  async getByDate(date: string): Promise<CycleLog | undefined> {
    return db.cycleLogs.where('date').equals(date).first()
  }

  async getRange(from: string, to: string): Promise<CycleLog[]> {
    const list = await db.cycleLogs.where('date').between(from, to, true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async getAll(): Promise<CycleLog[]> {
    const list = await db.cycleLogs.toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  /** One log per day: editing today's entry updates it instead of creating a duplicate. */
  async upsertForDate(date: string, changes: Partial<Omit<CycleLog, 'id' | 'date'>>): Promise<void> {
    const existing = await this.getByDate(date)
    if (existing) {
      await db.cycleLogs.update(existing.id, changes)
    } else {
      await db.cycleLogs.add({ id: createId(), date, ...changes })
    }
  }

  async delete(id: string): Promise<void> {
    await db.cycleLogs.delete(id)
  }
}

export const cycleRepository = new CycleRepository()
