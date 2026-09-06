import { createId } from '@/utils/id'
import { nowIso } from '@/utils/date'

import { db } from '../db'
import type { Workout, WorkoutExercise } from '../types'

class WorkoutRepository {
  async getAll(): Promise<Workout[]> {
    return db.workouts.filter((w) => !w.archived).toArray()
  }

  async get(id: string): Promise<Workout | undefined> {
    return db.workouts.get(id)
  }

  async getExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const list = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
    return list.sort((a, b) => a.position - b.position)
  }

  /** Workout + its exercise rows are created together (§29). */
  async createWithExercises(workout: Workout, exercises: WorkoutExercise[]): Promise<void> {
    await db.transaction('rw', db.workouts, db.workoutExercises, async () => {
      await db.workouts.add(workout)
      await db.workoutExercises.bulkAdd(exercises)
    })
  }

  async updateMeta(id: string, changes: Partial<Pick<Workout, 'name' | 'category' | 'description' | 'estimatedMinutes'>>): Promise<void> {
    await db.workouts.update(id, { ...changes, updatedAt: nowIso() })
  }

  async updateExercises(workoutId: string, exercises: WorkoutExercise[]): Promise<void> {
    await db.transaction('rw', db.workouts, db.workoutExercises, async () => {
      await db.workoutExercises.where('workoutId').equals(workoutId).delete()
      await db.workoutExercises.bulkAdd(exercises)
      await db.workouts.update(workoutId, { updatedAt: nowIso() })
    })
  }

  /** Archiving preserves session history instead of destroying it (§12). */
  async archive(id: string): Promise<void> {
    await db.workouts.update(id, { archived: true })
  }

  async duplicate(id: string, name: string): Promise<Workout> {
    const source = await this.get(id)
    if (!source) throw new Error(`Workout ${id} not found`)
    const sourceExercises = await this.getExercises(id)

    const copy: Workout = {
      ...source,
      id: createId(),
      name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      archived: false,
    }
    const copyExercises: WorkoutExercise[] = sourceExercises.map((e) => ({
      ...e,
      id: createId(),
      workoutId: copy.id,
    }))
    await this.createWithExercises(copy, copyExercises)
    return copy
  }
}

export const workoutRepository = new WorkoutRepository()
