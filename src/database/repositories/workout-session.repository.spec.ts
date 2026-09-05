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
    expect(stats?.workoutVolume).toBe(500)
  })

  it('getLastPerformance returns the most recent completed set logs for an exercise', async () => {
    const { workout, exercises } = await seedWorkout()
    const exerciseId = exercises[0].exerciseId

    const session1 = await workoutSessionRepository.start(workout, exercises, today())
    const [es1] = await workoutSessionRepository.getExerciseSessions(session1.id)
    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: es1.id,
      setIndex: 0,
      reps: 8,
      weight: 40,
      completedAt: new Date().toISOString(),
    })
    await workoutSessionRepository.finish(session1.id)

    const session2 = await workoutSessionRepository.start(workout, exercises, today())
    const [es2] = await workoutSessionRepository.getExerciseSessions(session2.id)
    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: es2.id,
      setIndex: 0,
      reps: 10,
      weight: 45,
      completedAt: new Date().toISOString(),
    })

    // Active session2 shouldn't count as "last performance" for itself.
    const last = await workoutSessionRepository.getLastPerformance(exerciseId, session2.id)
    expect(last?.session.id).toBe(session1.id)
    expect(last?.setLogs).toHaveLength(1)
    expect(last?.setLogs[0].weight).toBe(40)
  })

  it('getHistoricalBest finds the max across prior completed sessions, ignoring the current one', async () => {
    const { workout, exercises } = await seedWorkout()
    const exerciseId = exercises[0].exerciseId
    const byWeight = (l: { weight?: number }) => l.weight

    const session1 = await workoutSessionRepository.start(workout, exercises, today())
    const [es1] = await workoutSessionRepository.getExerciseSessions(session1.id)
    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: es1.id,
      setIndex: 0,
      reps: 8,
      weight: 60,
      completedAt: new Date().toISOString(),
    })
    await workoutSessionRepository.finish(session1.id)

    const session2 = await workoutSessionRepository.start(workout, exercises, today())
    const [es2] = await workoutSessionRepository.getExerciseSessions(session2.id)

    // Before logging anything in session2, its historical best is session1's 60.
    expect(await workoutSessionRepository.getHistoricalBest(exerciseId, session2.id, byWeight)).toBe(60)

    // A heavier set in the still-active session2 shouldn't count as "historical" for itself.
    await workoutSessionRepository.logSet({
      id: createId(),
      exerciseSessionId: es2.id,
      setIndex: 0,
      reps: 5,
      weight: 70,
      completedAt: new Date().toISOString(),
    })
    expect(await workoutSessionRepository.getHistoricalBest(exerciseId, session2.id, byWeight)).toBe(60)
  })
})
