import { db } from '../db'
import type { Profile } from '../types'
import { BaseRepository } from './base.repository'

class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super(db.profiles)
  }

  /** There is exactly one local profile in the MVP; `id` is fixed. */
  async getCurrent(): Promise<Profile | undefined> {
    return this.table.toCollection().first()
  }
}

export const profileRepository = new ProfileRepository()
