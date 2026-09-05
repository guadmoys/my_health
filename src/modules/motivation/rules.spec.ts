import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/database/db'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import { dismissRule, evaluateRules } from './rules'

describe('evaluateRules', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([
      db.wellbeingLogs.clear(),
      db.workoutSessions.clear(),
      db.habits.clear(),
      db.habitLogs.clear(),
      db.settings.clear(),
    ])
  })

  it('surfaces the safety rule when discomfort is marked today, at the highest priority', async () => {
    await db.wellbeingLogs.add({ id: createId(), date: today(), discomfort: true })

    const rules = await evaluateRules()
    expect(rules[0].id).toBe('discomfort-no-progression')
  })

  it('does not suggest more load when discomfort is marked (never a progression prompt)', async () => {
    await db.wellbeingLogs.add({ id: createId(), date: today(), discomfort: true })

    const rules = await evaluateRules()
    expect(rules.some((r) => /increase|progress|увеличь/i.test(r.text))).toBe(false)
  })

  it('reminds about remaining daily habits, and stops once dismissed for today', async () => {
    await db.habits.add({
      id: 'h1',
      name: 'Drink water',
      schedule: 'daily',
      targetPerPeriod: 1,
      active: true,
      createdAt: '',
    })

    let rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'daily-habits-remaining')?.text).toContain('1')

    await dismissRule({ id: 'daily-habits-remaining', period: 'day' })
    rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'daily-habits-remaining')).toBeUndefined()
  })

  it('never modifies data on its own — evaluating rules performs no writes to habits/wellbeing', async () => {
    await db.habits.add({
      id: 'h1',
      name: 'Drink water',
      schedule: 'daily',
      targetPerPeriod: 1,
      active: true,
      createdAt: '',
    })
    await evaluateRules()

    const habit = await db.habits.get('h1')
    expect(habit?.active).toBe(true)
    expect(await db.habitLogs.count()).toBe(0)
  })
})
