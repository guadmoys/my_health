import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '../db'
import { ensureDefaultProfile, seedDatabase } from './index'

describe('seedDatabase', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([
      db.exercises.clear(),
      db.workouts.clear(),
      db.workoutExercises.clear(),
      db.programs.clear(),
      db.programWeeks.clear(),
      db.programDays.clear(),
      db.profiles.clear(),
    ])
  })

  it('populates exercises, workouts and programs, and is idempotent', async () => {
    await seedDatabase()

    expect(await db.exercises.count()).toBeGreaterThan(0)
    expect(await db.workouts.count()).toBe(6)
    expect(await db.programs.count()).toBe(5)

    const programs = await db.programs.toArray()
    for (const program of programs) {
      const weeks = await db.programWeeks.where('programId').equals(program.id).toArray()
      expect(weeks).toHaveLength(program.weeksCount ?? 0)
      for (const week of weeks) {
        const days = await db.programDays.where('weekId').equals(week.id).toArray()
        expect(days).toHaveLength(7)
        for (const day of days) {
          if (day.type === 'workout') {
            expect(day.workoutId).toBeDefined()
          }
        }
      }
    }

    const exerciseCountAfterFirstSeed = await db.exercises.count()
    await seedDatabase()
    expect(await db.exercises.count()).toBe(exerciseCountAfterFirstSeed)
  })

  it('never assigns a workout that references an unknown exercise', async () => {
    await seedDatabase()
    const exerciseIds = new Set((await db.exercises.toArray()).map((e) => e.id))
    const workoutExercises = await db.workoutExercises.toArray()
    for (const we of workoutExercises) {
      expect(exerciseIds.has(we.exerciseId)).toBe(true)
    }
  })
})

describe('ensureDefaultProfile', () => {
  beforeEach(async () => {
    await db.open()
    await db.profiles.clear()
  })

  it('creates exactly one profile and is idempotent', async () => {
    await ensureDefaultProfile()
    await ensureDefaultProfile()
    expect(await db.profiles.count()).toBe(1)
  })
})
