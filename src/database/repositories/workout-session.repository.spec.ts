import { beforeEach, describe, expect, it } from 'vitest'

import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Workout, WorkoutExercise } from '../types'
import { workoutSessionRepository } from './workout-session.repository'

describe('workoutSessionRepository', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([
      db.workouts.clear(),
      db.workoutExercises.clear(),
      db.workoutSessions.clear(),
      db.exerciseSessions.clear(),
      db.setLogs.clear(),
      db.dailyStats.clear(),
    ])
  })

  async function seedWorkout() {
    const workout: Workout = {
      id: createId(),
      name: 'Full Body',
      category: 'strength',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const exercises: WorkoutExercise[] = [
      {
        id: createId(),
        workoutId: workout.id,
        exerciseId: createId(),
        position: 0,
        sets: 3,
        restSeconds: 90,
      },
    ]
    await db.workouts.add(workout)
    await db.workoutExercises.bulkAdd(exercises)
    return { workout, exercises }
  }

  it('creates an active session before any set is logged, and survives a simulated reload', async () => {
    const { workout, exercises } = await seedWorkout()
    const session = await workoutSessionRepository.start(workout, exercises, today())

    expect(session.status).toBe('active')

    // Simulate reload: nothing but a fresh query against IndexedDB.
    const resumed = await workoutSessionRepository.getActive()
    expect(resumed?.id).toBe(session.id)

    const exerciseSessions = await workoutSessionRepository.getExerciseSessions(session.id)
    expect(exerciseSessions).toHaveLength(1)

    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: exerciseSessions[0].id,
      setIndex: 0,
      reps: 10,
      weight: 50,
      completedAt: new Date().toISOString(),
    })

    const setsAfterReload = await workoutSessionRepository.getSetLogs(exerciseSessions[0].id)
    expect(setsAfterReload).toHaveLength(1)
  })

  it('atomically finishes a session and recomputes DailyStats', async () => {
    const { workout, exercises } = await seedWorkout()
    const session = await workoutSessionRepository.start(workout, exercises, today())
    const [exerciseSession] = await workoutSessionRepository.getExerciseSessions(session.id)

    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: exerciseSession.id,
      setIndex: 0,
      reps: 10,
      weight: 50,
      completedAt: new Date().toISOString(),
    })

    const finished = await workoutSessionRepository.finish(session.id)
    expect(finished.status).toBe('completed')
    expect(finished.totalVolume).toBe(500)

    const stats = await db.dailyStats.get(today())
    expect(stats?.workoutCount).toBe(1)
  })
})
