import { db } from '../db'
import type { Medicine } from '../types'
import { BaseRepository } from './base.repository'

class MedicineRepository extends BaseRepository<Medicine> {
  constructor() {
    super(db.medicines)
  }

  async getAll(): Promise<Medicine[]> {
    const list = await this.table.toArray()
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async search(query: string): Promise<Medicine[]> {
    const q = query.trim().toLowerCase()
    const all = await this.getAll()
    if (!q) return all
    return all.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    )
  }
}

export const medicineRepository = new MedicineRepository()
