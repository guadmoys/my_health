import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Achievement } from '../types'

class AchievementRepository {
  async getAll(): Promise<Achievement[]> {
    const list = await db.achievements.toArray()
    return list.sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
  }

  async isUnlocked(key: string): Promise<boolean> {
    return (await db.achievements.filter((a) => a.key === key).count()) > 0
  }

  async unlock(key: string): Promise<Achievement | undefined> {
    if (await this.isUnlocked(key)) return undefined
    const achievement: Achievement = { id: createId(), key, unlockedAt: nowIso() }
    await db.achievements.add(achievement)
    return achievement
  }
}

export const achievementRepository = new AchievementRepository()
