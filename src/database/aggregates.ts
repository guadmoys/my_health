import type { VitaDatabase } from './db'
import type { DailyStats, DateString } from './types'

/**
 * Every table `recalculateDailyStats` reads or writes. A caller that wraps
 * the recalculation in its own transaction must include this whole set —
 * IndexedDB transactions can only touch object stores declared up front.
 */
export function dailyStatsSourceTables(db: VitaDatabase) {
  return [
    db.meals,
    db.mealItems,
    db.waterLogs,
    db.workoutSessions,
    db.activityLogs,
    db.sleepLogs,
    db.weights,
    db.habitLogs,
    db.habits,
    db.dailyStats,
  ]
}

/**
 * Recomputes the DailyStats row for a single day from source records.
 * Called after any mutation that touches that day (§27) — never rescans
 * the full history.
 */
export async function recalculateDailyStats(db: VitaDatabase, date: DateString): Promise<DailyStats> {
  const [meals, waterLogs, workoutSessions, activityLogs, sleepLogs, weights, habitLogs, allHabits] =
    await Promise.all([
      db.meals.where('date').equals(date).toArray(),
      db.waterLogs.where('date').equals(date).toArray(),
      db.workoutSessions.where('date').equals(date).toArray(),
      db.activityLogs.where('date').equals(date).toArray(),
      db.sleepLogs.where('date').equals(date).toArray(),
      db.weights.where('date').equals(date).toArray(),
      db.habitLogs.where('date').equals(date).toArray(),
      db.habits.toArray(),
    ])
  // IndexedDB cannot index boolean values, so `active` is filtered in memory.
  const activeHabits = allHabits.filter((h) => h.active)

  const mealItems = meals.length
    ? await db.mealItems.where('mealId').anyOf(meals.map((m) => m.id)).toArray()
    : []

  const nutrition = mealItems.reduce(
    (acc, item) => {
      acc.calories += item.nutritionSnapshot.kcal ?? 0
      acc.protein += item.nutritionSnapshot.protein ?? 0
      acc.carbs += item.nutritionSnapshot.carbs ?? 0
      acc.fat += item.nutritionSnapshot.fat ?? 0
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const hasNutritionData = mealItems.some((item) => item.nutritionSnapshot.kcal !== undefined)

  const completedSessions = workoutSessions.filter((s) => s.status === 'completed')
  const workoutMinutes = completedSessions.reduce(
    (sum, s) => sum + Math.round((s.totalDurationSeconds ?? 0) / 60),
    0,
  )

  const steps = activityLogs
    .filter((a) => a.type === 'steps')
    .reduce((sum, a) => sum + (a.value ?? 0), 0)
  const activityMinutes = activityLogs.reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0)

  const sleepMinutes = sleepLogs.reduce((sum, s) => sum + s.durationMinutes, 0)

  const dailyHabitIds = new Set(activeHabits.filter((h) => h.schedule === 'daily').map((h) => h.id))
  const habitsPlanned = dailyHabitIds.size
  const habitsCompleted = habitLogs.filter((l) => l.completed && dailyHabitIds.has(l.habitId)).length

  const stats: DailyStats = {
    date,
    ...(hasNutritionData
      ? {
          calories: Math.round(nutrition.calories),
          protein: Math.round(nutrition.protein),
          carbs: Math.round(nutrition.carbs),
          fat: Math.round(nutrition.fat),
        }
      : {}),
    waterMl: waterLogs.reduce((sum, w) => sum + w.amountMl, 0),
    workoutMinutes,
    workoutCount: completedSessions.length,
    steps: steps || undefined,
    activityMinutes: activityMinutes || undefined,
    sleepMinutes: sleepMinutes || undefined,
    weight: weights.at(-1)?.value,
    habitsCompleted,
    habitsPlanned,
  }

  await db.dailyStats.put(stats)
  return stats
}
