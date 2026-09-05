import { db } from '../db'
import type { Setting } from '../types'
import { BaseRepository } from './base.repository'

class SettingsRepository extends BaseRepository<Setting> {
  constructor() {
    super(db.settings)
  }

  async getValue<T>(key: string, fallback: T): Promise<T> {
    const setting = await this.table.get(key)
    return setting ? (setting.value as T) : fallback
  }

  async setValue(key: string, value: unknown): Promise<void> {
    await this.table.put({ key, value })
  }
}

export const settingsRepository = new SettingsRepository()
