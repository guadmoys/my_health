import { db } from './db'

/**
 * A full local backup (§ backup/import): every row in every table, dumped
 * generically via `db.tables` so this stays correct as the schema grows
 * without needing to be updated per table.
 */
export interface BackupFile {
  app: 'vita'
  schemaVersion: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export function isBackupFile(value: unknown): value is BackupFile {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as BackupFile).app === 'vita' &&
    typeof (value as BackupFile).tables === 'object'
  )
}

export async function createBackup(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  await db.transaction('r', db.tables, async () => {
    for (const table of db.tables) {
      tables[table.name] = await table.toArray()
    }
  })
  return {
    app: 'vita',
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

/**
 * Replaces all local data with the contents of `backup`. Destructive by
 * design — the caller is responsible for confirming with the user first.
 * Tables present in the current schema but absent from the backup (e.g. an
 * older export made before a table existed) are simply cleared.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  if (!isBackupFile(backup)) {
    throw new Error('Файл повреждён или не является резервной копией VITA.')
  }

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = backup.tables[table.name]
      if (rows?.length) await table.bulkPut(rows as never[])
    }
  })
}
