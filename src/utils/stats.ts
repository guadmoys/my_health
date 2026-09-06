/** Average of `getValue(item)` over items where it's defined; undefined if none are. */
export function average<T>(items: T[], getValue: (item: T) => number | undefined): number | undefined {
  const values = items.map(getValue).filter((v): v is number => v !== undefined)
  if (!values.length) return undefined
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function sum<T>(items: T[], getValue: (item: T) => number | undefined): number {
  return items.reduce((total, item) => total + (getValue(item) ?? 0), 0)
}

export function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} ч ${Math.round(minutes % 60)} мин`
}
