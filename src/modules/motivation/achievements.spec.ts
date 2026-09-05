import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/database/db'
import { workoutSessionRepository } from '@/database/repositories'
import type { Exercise, Workout, WorkoutExercise } from '@/database/types'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import { checkWorkoutAchievements } from './achievements'

describe('checkWorkoutAchievements', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([
      db.workouts.clear(),
      db.workoutExercises.clear(),
      db.workoutSessions.clear(),
      db.exerciseSessions.clear(),
      db.setLogs.clear(),
      db.dailyStats.clear(),
      db.exercises.clear(),
      db.achievements.clear(),
    ])
  })

  async function seed() {
    const exercise: Exercise = {
      id: createId(),
      name: 'Squat',
      category: 'strength',
      muscles: [],
      equipment: [],
      type: 'reps',
      custom: false,
      archived: false,
      createdAt: '',
    }
    await db.exercises.add(exercise)

    const workout: Workout = {
      id: createId(),
      name: 'Full Body',
      category: 'strength',
      archived: false,
      createdAt: '',
      updatedAt: '',
    }
    const workoutExercise: WorkoutExercise = {
      id: createId(),
      workoutId: workout.id,
      exerciseId: exercise.id,
      position: 0,
      sets: 1,
      restSeconds: 60,
    }
    await db.workouts.add(workout)
    await db.workoutExercises.add(workoutExercise)
    return { workout, exercise, workoutExercise }
  }

  async function completeSession(workout: Workout, exercises: WorkoutExercise[], weight: number) {
    const session = await workoutSessionRepository.start(workout, exercises, today())
    const [es] = await workoutSessionRepository.getExerciseSessions(session.id)
    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: es.id,
      setIndex: 0,
      reps: 5,
      weight,
      completedAt: new Date().toISOString(),
    })
    await workoutSessionRepository.finish(session.id)
    return session.id
  }

  it('unlocks "first_workout" and a PR on the very first completed session', async () => {
    const { workout, workoutExercise } = await seed()
    const sessionId = await completeSession(workout, [workoutExercise], 50)

    const unlocked = await checkWorkoutAchievements(sessionId)
    expect(unlocked).toContain('first_workout')
    expect(unlocked.some((k) => k.startsWith('pr:'))).toBe(true)

    const all = await db.achievements.toArray()
    expect(all.map((a) => a.key)).toEqual(expect.arrayContaining(['first_workout']))
  })

  it('does not re-unlock "first_workout" and does not award a PR for a lighter set', async () => {
    const { workout, workoutExercise } = await seed()
    await completeSession(workout, [workoutExercise], 50)

    const secondSessionId = await completeSession(workout, [workoutExercise], 40)
    const unlocked = await checkWorkoutAchievements(secondSessionId)

    expect(unlocked).not.toContain('first_workout')
    expect(unlocked.some((k) => k.startsWith('pr:'))).toBe(false)
  })

  it('awards a new PR when a later session lifts more weight', async () => {
    const { workout, workoutExercise } = await seed()
    await completeSession(workout, [workoutExercise], 50)

    const heavierSessionId = await completeSession(workout, [workoutExercise], 60)
    const unlocked = await checkWorkoutAchievements(heavierSessionId)

    expect(unlocked.some((k) => k.startsWith('pr:'))).toBe(true)
  })
})
