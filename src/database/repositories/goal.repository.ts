import { db } from '../db'
import type { Goal } from '../types'
import { BaseRepository } from './base.repository'

class GoalRepository extends BaseRepository<Goal> {
  constructor() {
    super(db.goals)
  }

  getActive(): Promise<Goal[]> {
    return this.table.where('status').equals('active' satisfies Goal['status']).toArray()
  }

  async getPrimary(): Promise<Goal | undefined> {
    const active = await this.getActive()
    return active.find((g) => g.isPrimary)
  }

  /** Only one goal may be primary at a time. */
  async setPrimary(id: string): Promise<void> {
    await db.transaction('rw', this.table, async () => {
      const current = await this.getActive()
      await Promise.all(
        current.map((g) => this.table.update(g.id, { isPrimary: g.id === id })),
      )
    })
  }
}

export const goalRepository = new GoalRepository()
