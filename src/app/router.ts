import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
    path: '/workouts/session/:sessionId',
    name: 'workout-session',
    component: () => import('@/modules/workouts/WorkoutSessionView.vue'),
    props: true,
  },
  {
    path: '/workouts/:id',
    name: 'workout-detail',
    component: () => import('@/modules/workouts/WorkoutDetailView.vue'),
    props: true,
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
    path: '/achievements',
    name: 'achievements',
    component: () => import('@/modules/motivation/AchievementsView.vue'),
  },
  {
    path: '/cycle',
    name: 'cycle',
    component: () => import('@/modules/cycle/CycleView.vue'),
  },
  {
    path: '/medicines',
    name: 'medicines',
    component: () => import('@/modules/medicines/MedicinesView.vue'),
  },
  {
    path: '/more',
    name: 'more',
    component: () => import('@/app/MoreView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
