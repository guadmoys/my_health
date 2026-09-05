import {
  barbellOutline,
  calendarOutline,
  checkmarkCircleOutline,
  ellipsisHorizontalOutline,
  restaurantOutline,
  settingsOutline,
  statsChartOutline,
  sunnyOutline,
  trendingUpOutline,
} from 'ionicons/icons'

export interface NavItem {
  label: string
  to: string
  icon: string
}

/** Desktop left nav (Таблица 6). */
export const desktopNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: sunnyOutline },
  { label: 'Питание', to: '/nutrition', icon: restaurantOutline },
  { label: 'Тренировки', to: '/workouts', icon: barbellOutline },
  { label: 'Календарь', to: '/calendar', icon: calendarOutline },
  { label: 'Прогресс', to: '/progress', icon: trendingUpOutline },
  { label: 'Привычки', to: '/habits', icon: checkmarkCircleOutline },
  { label: 'Аналитика', to: '/analytics', icon: statsChartOutline },
  { label: 'Настройки', to: '/settings', icon: settingsOutline },
]

/** Mobile bottom tab bar (Таблица 6) — the central slot is the "+" quick-add action, not a route. */
export const mobileNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: sunnyOutline },
  { label: 'Дневник', to: '/nutrition', icon: restaurantOutline },
  { label: 'Прогресс', to: '/progress', icon: trendingUpOutline },
  { label: 'Ещё', to: '/more', icon: ellipsisHorizontalOutline },
]
