import { beforeEach, describe, expect, it } from 'vitest'

import { today } from '@/utils/date'

import { db } from '../db'
import { activityRepository } from './activity.repository'

describe('activityRepository.upsertStepsForDate', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([db.activityLogs.clear(), db.dailyStats.clear()])
  })

  it('replaces the day\'s step count instead of stacking a new entry on top', async () => {
    await activityRepository.upsertStepsForDate(today(), 3000)
    await activityRepository.upsertStepsForDate(today(), 5000)

    const logs = await activityRepository.getByDate(today())
    expect(logs.filter((l) => l.type === 'steps')).toHaveLength(1)
    expect(logs.find((l) => l.type === 'steps')?.value).toBe(5000)

    const stats = await db.dailyStats.get(today())
    expect(stats?.steps).toBe(5000)
  })

  it('leaves other activity types untouched', async () => {
    await activityRepository.add({ id: 'walk-1', date: today(), type: 'walk', durationMinutes: 30 })
    await activityRepository.upsertStepsForDate(today(), 4000)

    const logs = await activityRepository.getByDate(today())
    expect(logs).toHaveLength(2)
  })

  it('hasAnySteps reflects whether steps have ever been logged', async () => {
    expect(await activityRepository.hasAnySteps()).toBe(false)
    await activityRepository.upsertStepsForDate(today(), 1000)
    expect(await activityRepository.hasAnySteps()).toBe(true)
  })
})
