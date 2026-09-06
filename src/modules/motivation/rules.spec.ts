import dayjs from 'dayjs'
import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/database/db'
import { settingsRepository } from '@/database/repositories'
import { DATE_FORMAT, today } from '@/utils/date'
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
      db.activityLogs.clear(),
      db.dailyStats.clear(),
      db.cycleLogs.clear(),
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

  it('reminds how many steps remain toward the goal, and clears once the goal is met', async () => {
    await settingsRepository.setValue('stepsGoal', 8000)
    await db.dailyStats.put({ date: today(), steps: 5000 })

    let rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'steps-remaining')?.text).toContain('3000')

    await db.dailyStats.put({ date: today(), steps: 8000 })
    rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'steps-remaining')).toBeUndefined()
  })

  it('flags high cycle pain with the same safety framing as general discomfort', async () => {
    await db.cycleLogs.add({ id: createId(), date: today(), pain: 4 })

    const rules = await evaluateRules()
    expect(rules[0].id).toBe('cycle-pain-no-progression')
    expect(rules.some((r) => /increase|progress|увеличь/i.test(r.text))).toBe(false)
  })

  it('does not flag mild cycle pain', async () => {
    await db.cycleLogs.add({ id: createId(), date: today(), pain: 2 })

    const rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'cycle-pain-no-progression')).toBeUndefined()
  })

  it('surfaces a period-soon tip once two cycles establish a predictable length', async () => {
    // Two 28-day-apart period starts, positioned so the next predicted start is in 1 day.
    const secondStart = dayjs(today()).subtract(27, 'day').format(DATE_FORMAT)
    const firstStart = dayjs(secondStart).subtract(28, 'day').format(DATE_FORMAT)
    await db.cycleLogs.bulkAdd([
      { id: createId(), date: firstStart, flow: 'medium' },
      { id: createId(), date: secondStart, flow: 'medium' },
    ])

    const rules = await evaluateRules()
    expect(rules.find((r) => r.id === 'cycle-period-soon')).toBeDefined()
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
