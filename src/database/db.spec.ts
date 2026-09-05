import { describe, expect, it } from 'vitest'

import { VitaDatabase } from './db'

describe('VitaDatabase schema', () => {
  it('opens and exposes all v1 stores', async () => {
    const db = new VitaDatabase(`vita-test-${crypto.randomUUID()}`)
    await db.open()

    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'profiles',
        'goals',
        'foods',
        'recipes',
        'recipeIngredients',
        'meals',
        'mealItems',
        'waterLogs',
        'exercises',
        'workouts',
        'workoutExercises',
        'programs',
        'programWeeks',
        'programDays',
        'workoutSessions',
        'exerciseSessions',
        'setLogs',
        'weights',
        'bodyMeasurements',
        'sleepLogs',
        'activityLogs',
        'wellbeingLogs',
        'habits',
        'habitLogs',
        'notes',
        'achievements',
        'dailyStats',
        'settings',
        'cycleLogs',
      ].sort(),
    )

    db.close()
    await db.delete()
  })
})
