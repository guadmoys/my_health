import { db } from '../db'
import type { Note } from '../types'

class NoteRepository {
  async getByDate(date: string): Promise<Note[]> {
    return db.notes.where('date').equals(date).toArray()
  }

  async add(note: Note): Promise<void> {
    await db.notes.add(note)
  }

  async update(id: string, text: string): Promise<void> {
    await db.notes.update(id, { text })
  }

  async delete(id: string): Promise<void> {
    await db.notes.delete(id)
  }
}

export const noteRepository = new NoteRepository()
