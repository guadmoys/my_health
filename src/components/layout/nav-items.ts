export interface NavItem {
  label: string
  to: string
  icon: string
}

/** Desktop left nav (Таблица 6). */
export const desktopNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: '☀️' },
  { label: 'Питание', to: '/nutrition', icon: '🍽️' },
  { label: 'Тренировки', to: '/workouts', icon: '🏋️' },
  { label: 'Календарь', to: '/calendar', icon: '📅' },
  { label: 'Прогресс', to: '/progress', icon: '📈' },
  { label: 'Привычки', to: '/habits', icon: '✅' },
  { label: 'Аналитика', to: '/analytics', icon: '📊' },
  { label: 'Настройки', to: '/settings', icon: '⚙️' },
]

/** Mobile bottom nav (Таблица 6) — the central slot is the "+" quick-add action, not a route. */
export const mobileNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: '☀️' },
  { label: 'Дневник', to: '/nutrition', icon: '🍽️' },
  { label: 'Прогресс', to: '/progress', icon: '📈' },
  { label: 'Ещё', to: '/more', icon: '⋯' },
]
