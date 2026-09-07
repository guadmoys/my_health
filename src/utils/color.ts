/**
 * Deterministic pastel hue from a string, so the same category/label always
 * renders with the same accent color across a list without a lookup table.
 */
export function stringHue(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) % 360
  return hash
}
