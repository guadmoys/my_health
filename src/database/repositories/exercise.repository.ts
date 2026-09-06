import { db } from '../db'
import type { Exercise } from '../types'
import { BaseRepository } from './base.repository'

export interface ExerciseFilter {
  query?: string
  category?: string
  muscle?: string
  equipment?: string
}

class ExerciseRepository extends BaseRepository<Exercise> {
  constructor() {
    super(db.exercises)
  }

  async find(filter: ExerciseFilter): Promise<Exercise[]> {
    const all = await this.table.filter((e) => !e.archived).toArray()
    const q = filter.query?.trim().toLowerCase()
    return all.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false
      if (filter.category && e.category !== filter.category) return false
      if (filter.muscle && !e.muscles.includes(filter.muscle)) return false
      if (filter.equipment && !e.equipment.includes(filter.equipment)) return false
      return true
    })
  }
}

export const exerciseRepository = new ExerciseRepository()
