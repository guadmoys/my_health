import { beforeEach, describe, expect, it } from 'vitest'

import { today } from '@/utils/date'

import { db } from '../db'
import { noteRepository } from './note.repository'

describe('noteRepository.upsertForDate', () => {
  beforeEach(async () => {
    await db.open()
    await db.notes.clear()
  })

  it('creates a note, then edits the same one instead of duplicating it', async () => {
    await noteRepository.upsertForDate(today(), 'First draft')
    let notes = await noteRepository.getByDate(today())
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('First draft')

    await noteRepository.upsertForDate(today(), 'Edited')
    notes = await noteRepository.getByDate(today())
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('Edited')
  })
})
