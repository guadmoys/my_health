import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Exercise, Profile, Program, ProgramDay, ProgramWeek, Workout, WorkoutExercise } from '../types'
import { exerciseSeeds } from './exercises.seed'
import { programSeeds } from './programs.seed'
import { workoutSeeds } from './workouts.seed'

/**
 * Creates the single local profile on first run, with safe MVP defaults
 * (nutrition shown in full, calories not hidden by default). Idempotent.
 */
export async function ensureDefaultProfile(): Promise<void> {
  const existing = await db.profiles.count()
  if (existing > 0) return

  const profile: Profile = {
    id: 'local',
    units: 'metric',
    nutritionDisplayMode: 'full',
    weekStartsOn: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  await db.profiles.add(profile)
}

/**
 * Populates the base exercise library and preset programs on first run.
 * Idempotent: does nothing once the exercise library is non-empty, so it is
 * always safe to call at app startup.
 */
export async function seedDatabase(): Promise<void> {
  const alreadySeeded = (await db.exercises.count()) > 0
  if (alreadySeeded) return

  const exercises: Exercise[] = exerciseSeeds.map((seed) => ({
    id: createId(),
    ...seed,
    custom: false,
    archived: false,
    createdAt: nowIso(),
  }))
  const exerciseIdByName = new Map(exercises.map((e) => [e.name, e.id]))

  const workouts: Workout[] = []
  const workoutExercises: WorkoutExercise[] = []
  const workoutIdByKey = new Map<string, string>()

  for (const seed of workoutSeeds) {
    const workout: Workout = {
      id: createId(),
      name: seed.name,
      category: seed.category,
      description: seed.description,
      estimatedMinutes: seed.estimatedMinutes,
      archived: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    workouts.push(workout)
    workoutIdByKey.set(seed.key, workout.id)

    seed.exercises.forEach((we, position) => {
      const exerciseId = exerciseIdByName.get(we.exerciseName)
      if (!exerciseId) throw new Error(`Seed error: unknown exercise "${we.exerciseName}"`)
      workoutExercises.push({
        id: createId(),
        workoutId: workout.id,
        exerciseId,
        position,
        sets: we.sets,
        repsMin: we.repsMin,
        repsMax: we.repsMax,
        durationSeconds: we.durationSeconds,
        restSeconds: we.restSeconds,
      })
    })
  }

  const programs: Program[] = []
  const programWeeks: ProgramWeek[] = []
  const programDays: ProgramDay[] = []

  for (const seed of programSeeds) {
    const program: Program = {
      id: createId(),
      name: seed.name,
      goalType: seed.goalType,
      description: seed.description,
      weeksCount: seed.weeksCount,
      custom: false,
    }
    programs.push(program)

    for (let weekIndex = 0; weekIndex < seed.weeksCount; weekIndex++) {
      const week: ProgramWeek = { id: createId(), programId: program.id, weekIndex }
      programWeeks.push(week)

      for (const day of seed.days) {
        const workoutId = day.workoutKey ? workoutIdByKey.get(day.workoutKey) : undefined
        programDays.push({
          id: createId(),
          weekId: week.id,
          dayOfWeek: day.dayOfWeek,
          workoutId,
          type: workoutId ? 'workout' : 'rest',
        })
      }
    }
  }

  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.workoutExercises, db.programs, db.programWeeks, db.programDays],
    async () => {
      await db.exercises.bulkAdd(exercises)
      await db.workouts.bulkAdd(workouts)
      await db.workoutExercises.bulkAdd(workoutExercises)
      await db.programs.bulkAdd(programs)
      await db.programWeeks.bulkAdd(programWeeks)
      await db.programDays.bulkAdd(programDays)
    },
  )
}
