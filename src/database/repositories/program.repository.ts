import { db } from '../db'
import type { Program, ProgramDay, ProgramWeek } from '../types'

class ProgramRepository {
  async getAll(): Promise<Program[]> {
    return db.programs.toArray()
  }

  async get(id: string): Promise<Program | undefined> {
    return db.programs.get(id)
  }

  async getWeeks(programId: string): Promise<ProgramWeek[]> {
    const list = await db.programWeeks.where('programId').equals(programId).toArray()
    return list.sort((a, b) => a.weekIndex - b.weekIndex)
  }

  async getDays(weekId: string): Promise<ProgramDay[]> {
    const list = await db.programDays.where('weekId').equals(weekId).toArray()
    return list.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  }

  async create(program: Program, weeks: ProgramWeek[], days: ProgramDay[]): Promise<void> {
    await db.transaction('rw', db.programs, db.programWeeks, db.programDays, async () => {
      await db.programs.add(program)
      await db.programWeeks.bulkAdd(weeks)
      await db.programDays.bulkAdd(days)
    })
  }
}

export const programRepository = new ProgramRepository()
