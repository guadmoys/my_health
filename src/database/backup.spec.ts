import { beforeEach, describe, expect, it } from 'vitest'

import { createId } from '@/utils/id'

import { createBackup, isBackupFile, restoreBackup } from './backup'
import { db } from './db'

describe('backup', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('round-trips every table through export and restore', async () => {
    await db.habits.add({
      id: 'h1',
      name: 'Пить воду',
      schedule: 'daily',
      targetPerPeriod: 1,
      active: true,
      createdAt: '',
    })
    await db.cycleLogs.add({ id: createId(), date: '2026-09-01', pain: 3 })

    const backup = await createBackup()
    expect(backup.app).toBe('vita')
    expect(backup.tables.habits).toHaveLength(1)
    expect(backup.tables.cycleLogs).toHaveLength(1)

    await db.habits.clear()
    await db.cycleLogs.clear()
    expect(await db.habits.count()).toBe(0)

    await restoreBackup(backup)

    expect(await db.habits.count()).toBe(1)
    expect((await db.habits.get('h1'))?.name).toBe('Пить воду')
    expect(await db.cycleLogs.count()).toBe(1)
  })

  it('clears data that is absent from the backup instead of leaving it behind', async () => {
    const backup = await createBackup() // empty snapshot
    await db.habits.add({
      id: 'h1',
      name: 'Пить воду',
      schedule: 'daily',
      targetPerPeriod: 1,
      active: true,
      createdAt: '',
    })

    await restoreBackup(backup)

    expect(await db.habits.count()).toBe(0)
  })

  it('rejects a file that is not a VITA backup', async () => {
    await expect(restoreBackup({ foo: 'bar' } as never)).rejects.toThrow()
  })

  it('identifies valid and invalid backup shapes', () => {
    expect(isBackupFile({ app: 'vita', tables: {} })).toBe(true)
    expect(isBackupFile({ app: 'other', tables: {} })).toBe(false)
    expect(isBackupFile(null)).toBe(false)
    expect(isBackupFile('not an object')).toBe(false)
  })
})
