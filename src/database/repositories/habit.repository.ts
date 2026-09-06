import { createId } from '@/utils/id'

import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { Habit, HabitLog } from '../types'

class HabitRepository {
  async getActive(): Promise<Habit[]> {
    return db.habits.filter((h) => h.active).toArray()
  }

  async getAll(): Promise<Habit[]> {
    return db.habits.toArray()
  }

  async add(habit: Habit): Promise<void> {
    await db.habits.add(habit)
  }

  async archive(id: string): Promise<void> {
    await db.habits.update(id, { active: false })
  }

  async getLogsForRange(habitId: string, from: string, to: string): Promise<HabitLog[]> {
    const list = await db.habitLogs.where('[habitId+date]').between([habitId, from], [habitId, to], true, true).toArray()
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }

  async getLogForDate(habitId: string, date: string): Promise<HabitLog | undefined> {
    return db.habitLogs.where('[habitId+date]').equals([habitId, date]).first()
  }

  async setForDate(habitId: string, date: string, completed: boolean, value?: number): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      const existing = await this.getLogForDate(habitId, date)
      if (existing) {
        await db.habitLogs.update(existing.id, { completed, value })
      } else {
        await db.habitLogs.add({ id: createId(), habitId, date, completed, value })
      }
      await recalculateDailyStats(db, date)
    })
  }
}

export const habitRepository = new HabitRepository()
