import dayjs from 'dayjs'

import {
  achievementRepository,
  dailyStatsRepository,
  exerciseRepository,
  profileRepository,
  workoutSessionRepository,
} from '@/database/repositories'
import type { SetLog } from '@/database/types'
import { DATE_FORMAT, today } from '@/utils/date'

/**
 * Achievements (§23) — never for extreme restriction, rapid weight loss, or
 * excessive training; only for showing up (first workout, milestones,
 * consistency) or getting stronger (a genuine new personal record).
 */

export const WORKOUT_COUNT_MILESTONES = [5, 10, 25, 50, 100] as const

/** Call after a workout session finishes. Returns newly unlocked achievement keys. */
export async function checkWorkoutAchievements(sessionId: string): Promise<string[]> {
  const unlocked: string[] = []

  const completedCount = await workoutSessionRepository.countCompleted()
  if (completedCount === 1 && (await achievementRepository.unlock('first_workout'))) {
    unlocked.push('first_workout')
  }
  for (const milestone of WORKOUT_COUNT_MILESTONES) {
    if (completedCount >= milestone) {
      const key = `workouts_${milestone}`
      if (await achievementRepository.unlock(key)) unlocked.push(key)
    }
  }

  unlocked.push(...(await checkNewPersonalRecords(sessionId)))
  return unlocked
}

function metricFor(type: 'reps' | 'time' | 'distance') {
  if (type === 'reps') return (log: SetLog) => log.weight
  if (type === 'time') return (log: SetLog) => log.durationSeconds
  return (log: SetLog) => log.distance
}

/** A new PR is its own achievement per exercise per day, not a single one-time flag. */
async function checkNewPersonalRecords(sessionId: string): Promise<string[]> {
  const unlocked: string[] = []
  const exerciseSessions = await workoutSessionRepository.getExerciseSessions(sessionId)

  for (const exerciseSession of exerciseSessions) {
    const setLogs = await workoutSessionRepository.getSetLogs(exerciseSession.id)
    if (!setLogs.length) continue

    const exercise = await exerciseRepository.get(exerciseSession.exerciseId)
    if (!exercise) continue

    const metric = metricFor(exercise.type)
    const values = setLogs.map(metric).filter((v): v is number => v !== undefined && v > 0)
    if (!values.length) continue
    const currentBest = Math.max(...values)

    const historicalBest = await workoutSessionRepository.getHistoricalBest(
      exerciseSession.exerciseId,
      sessionId,
      metric,
    )
    if (historicalBest !== undefined && currentBest <= historicalBest) continue

    const key = `pr:${exerciseSession.exerciseId}:${today()}`
    if (await achievementRepository.unlock(key)) unlocked.push(key)
  }

  return unlocked
}

/** Call once per app session (e.g. when Today mounts) — cheap, idempotent checks. */
export async function checkOngoingAchievements(): Promise<string[]> {
  const unlocked: string[] = []

  const profile = await profileRepository.getCurrent()
  if (profile && dayjs().diff(dayjs(profile.createdAt), 'day') >= 30) {
    if (await achievementRepository.unlock('first_month')) unlocked.push('first_month')
  }

  const last7Dates = Array.from({ length: 7 }, (_, i) => dayjs().subtract(i, 'day').format(DATE_FORMAT))
  const stats = await dailyStatsRepository.getRange(last7Dates[6], today())
  const datesWithData = new Set(stats.map((s) => s.date))
  if (last7Dates.every((d) => datesWithData.has(d))) {
    if (await achievementRepository.unlock('streak_7')) unlocked.push('streak_7')
  }

  return unlocked
}

/** Resolves an achievement key into a human label. PR keys need the exercise name. */
export async function describeAchievement(key: string): Promise<string> {
  if (key === 'first_workout') return '🏋️ Первая тренировка'
  if (key === 'first_month') return '🗓️ Первый месяц с VITA'
  if (key === 'streak_7') return '🔥 7 дней подряд с записями'
  const milestoneMatch = key.match(/^workouts_(\d+)$/)
  if (milestoneMatch) return `🏋️ ${milestoneMatch[1]} тренировок`
  const prMatch = key.match(/^pr:(.+):(\d{4}-\d{2}-\d{2})$/)
  if (prMatch) {
    const exercise = await exerciseRepository.get(prMatch[1])
    return `🏆 Новый рекорд: ${exercise?.name ?? 'упражнение'} (${prMatch[2]})`
  }
  return key
}
