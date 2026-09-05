import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'today',
      component: () => import('@/modules/dashboard/TodayView.vue'),
    },
    {
      path: '/nutrition',
      name: 'nutrition',
      component: () => import('@/modules/nutrition/NutritionView.vue'),
    },
    {
      path: '/workouts',
      name: 'workouts',
      component: () => import('@/modules/workouts/WorkoutsView.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/modules/calendar/CalendarView.vue'),
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/modules/weight/ProgressView.vue'),
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('@/modules/habits/HabitsView.vue'),
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('@/modules/analytics/AnalyticsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/modules/settings/SettingsView.vue'),
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('@/app/MoreView.vue'),
    },
  ],
})
