import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { ExerciseSession, SetLog, Workout, WorkoutExercise, WorkoutSession } from '../types'

/**
 * The workout engine (§13): a session is created before the first exercise is
 * even shown, every set is persisted immediately, and it must survive a page
 * reload or the PWA being closed mid-workout.
 */
class WorkoutSessionRepository {
  async getActive(): Promise<WorkoutSession | undefined> {
    return db.workoutSessions.filter((s) => s.status === 'active').first()
  }

  async get(id: string): Promise<WorkoutSession | undefined> {
    return db.workoutSessions.get(id)
  }

  async getExerciseSessions(sessionId: string): Promise<ExerciseSession[]> {
    const list = await db.exerciseSessions.where('sessionId').equals(sessionId).toArray()
    return list.sort((a, b) => a.position - b.position)
  }

  async getSetLogs(exerciseSessionId: string): Promise<SetLog[]> {
    const list = await db.setLogs.where('exerciseSessionId').equals(exerciseSessionId).toArray()
    return list.sort((a, b) => a.setIndex - b.setIndex)
  }

  async start(workout: Workout, workoutExercises: WorkoutExercise[], date: string): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      id: createId(),
      workoutId: workout.id,
      date,
      startedAt: nowIso(),
      status: 'active',
    }
    const exerciseSessions: ExerciseSession[] = workoutExercises.map((we) => ({
      id: createId(),
      sessionId: session.id,
      exerciseId: we.exerciseId,
      position: we.position,
    }))
    await db.transaction('rw', db.workoutSessions, db.exerciseSessions, async () => {
      await db.workoutSessions.add(session)
      await db.exerciseSessions.bulkAdd(exerciseSessions)
    })
    return session
  }

  /** Written to IndexedDB right after each set — never batched or held in memory only. */
  async logSet(setLog: SetLog): Promise<void> {
    await db.setLogs.add(setLog)
  }

  async updateSet(id: string, changes: Partial<SetLog>): Promise<void> {
    await db.setLogs.update(id, changes as never)
  }

  async deleteSet(id: string): Promise<void> {
    await db.setLogs.delete(id)
  }

  /** Atomically finalizes the session and recomputes that day's DailyStats (§29). */
  async finish(sessionId: string): Promise<WorkoutSession> {
    return db.transaction(
      'rw',
      [db.exerciseSessions, db.setLogs, ...dailyStatsSourceTables(db)],
      async () => {
        const session = await db.workoutSessions.get(sessionId)
        if (!session) throw new Error(`WorkoutSession ${sessionId} not found`)

        const exerciseSessions = await db.exerciseSessions.where('sessionId').equals(sessionId).toArray()
        const setLogs = exerciseSessions.length
          ? await db.setLogs.where('exerciseSessionId').anyOf(exerciseSessions.map((e) => e.id)).toArray()
          : []

        const totalVolume = setLogs.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
        const finishedAt = nowIso()
        const totalDurationSeconds = Math.max(
          0,
          Math.round((new Date(finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000),
        )

        const updated: WorkoutSession = {
          ...session,
          status: 'completed',
          finishedAt,
          totalVolume,
          totalDurationSeconds,
        }
        await db.workoutSessions.put(updated)
        await recalculateDailyStats(db, session.date)
        return updated
      },
    )
  }

  async abandon(sessionId: string): Promise<void> {
    await db.workoutSessions.update(sessionId, { status: 'abandoned', finishedAt: nowIso() })
  }

  async getHistoryForWorkout(workoutId: string): Promise<WorkoutSession[]> {
    const list = await db.workoutSessions.where('workoutId').equals(workoutId).toArray()
    return list.filter((s) => s.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))
  }

  /** The most recent completed performance of this exercise, across any workout (§13 step 2, §14). */
  async getLastPerformance(
    exerciseId: string,
    excludeSessionId?: string,
  ): Promise<{ session: WorkoutSession; setLogs: SetLog[] } | undefined> {
    const exerciseSessions = await db.exerciseSessions.where('exerciseId').equals(exerciseId).toArray()
    const sessionIds = [...new Set(exerciseSessions.map((es) => es.sessionId))].filter(
      (id) => id !== excludeSessionId,
    )
    if (!sessionIds.length) return undefined

    const sessions = (await db.workoutSessions.bulkGet(sessionIds)).filter(
      (s): s is WorkoutSession => !!s && s.status === 'completed',
    )
    if (!sessions.length) return undefined

    sessions.sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt))
    const lastSession = sessions[0]
    const exerciseSession = exerciseSessions.find((es) => es.sessionId === lastSession.id)
    if (!exerciseSession) return undefined

    return { session: lastSession, setLogs: await this.getSetLogs(exerciseSession.id) }
  }
}

export const workoutSessionRepository = new WorkoutSessionRepository()
