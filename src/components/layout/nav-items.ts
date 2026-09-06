import {
  barbellOutline,
  calendarOutline,
  checkmarkCircleOutline,
  ellipsisHorizontal,
  ellipsisHorizontalOutline,
  restaurant,
  restaurantOutline,
  settingsOutline,
  statsChartOutline,
  sunny,
  sunnyOutline,
  trendingUp,
  trendingUpOutline,
  trophyOutline,
  waterOutline,
} from 'ionicons/icons'

export interface NavItem {
  label: string
  to: string
  icon: string
  /** Filled variant shown when the tab is active (Instagram-style icon swap). */
  activeIcon?: string
}

/** Desktop left nav (Таблица 6). */
export const desktopNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: sunnyOutline },
  { label: 'Питание', to: '/nutrition', icon: restaurantOutline },
  { label: 'Тренировки', to: '/workouts', icon: barbellOutline },
  { label: 'Календарь', to: '/calendar', icon: calendarOutline },
  { label: 'Прогресс', to: '/progress', icon: trendingUpOutline },
  { label: 'Привычки', to: '/habits', icon: checkmarkCircleOutline },
  { label: 'Цикл', to: '/cycle', icon: waterOutline },
  { label: 'Аналитика', to: '/analytics', icon: statsChartOutline },
  { label: 'Достижения', to: '/achievements', icon: trophyOutline },
  { label: 'Настройки', to: '/settings', icon: settingsOutline },
]

/** Mobile bottom tab bar (Таблица 6) — the central slot is the "+" quick-add action, not a route. */
export const mobileNavItems: NavItem[] = [
  { label: 'Сегодня', to: '/', icon: sunnyOutline, activeIcon: sunny },
  { label: 'Дневник', to: '/nutrition', icon: restaurantOutline, activeIcon: restaurant },
  { label: 'Прогресс', to: '/progress', icon: trendingUpOutline, activeIcon: trendingUp },
  { label: 'Ещё', to: '/more', icon: ellipsisHorizontalOutline, activeIcon: ellipsisHorizontal },
]
