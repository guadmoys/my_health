import type { EntityTable } from 'dexie'

/**
 * Thin wrapper around a single Dexie table. Components must go through a
 * repository instead of calling db.table(...) directly (see §29 of the spec).
 * Every store in the schema keys on a string (`id`, `date`, or `key`).
 *
 * `EntityTable`'s primary-key parameter is contravariant in places (its
 * change-hook signature), so a repository generic over T alone can't name an
 * exact key here without TypeScript rejecting every concrete table passed
 * in — hence the untyped key parameter, confined to this one field.
 */
export class BaseRepository<T extends object> {
  protected readonly table: EntityTable<T, any>

  constructor(table: EntityTable<T, any>) {
    this.table = table
  }

  get(id: string): Promise<T | undefined> {
    return this.table.get(id as never)
  }

  getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  async getMany(ids: string[]): Promise<T[]> {
    if (!ids.length) return []
    const results = await this.table.bulkGet(ids as never[])
    return results.filter((r): r is T => !!r)
  }

  async add(entity: T): Promise<T> {
    await this.table.add(entity)
    return entity
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    await this.table.update(id as never, changes as never)
  }

  delete(id: string): Promise<void> {
    return this.table.delete(id as never)
  }

  count(): Promise<number> {
    return this.table.count()
  }
}
