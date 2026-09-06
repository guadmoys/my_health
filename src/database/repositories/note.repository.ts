import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Note } from '../types'

class NoteRepository {
  async getByDate(date: string): Promise<Note[]> {
    return db.notes.where('date').equals(date).toArray()
  }

  async add(note: Note): Promise<void> {
    await db.notes.add(note)
  }

  /** One free-text note per day (§22): edits the existing one, or creates it. */
  async upsertForDate(date: string, text: string): Promise<void> {
    const [existing] = await this.getByDate(date)
    if (existing) {
      await this.update(existing.id, text)
    } else {
      await db.notes.add({ id: createId(), date, text, createdAt: nowIso() })
    }
  }

  async update(id: string, text: string): Promise<void> {
    await db.notes.update(id, { text })
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id)
  }
}

export const noteRepository = new NoteRepository()
