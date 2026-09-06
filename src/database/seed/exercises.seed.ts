import type { ExerciseResultType } from '../types'

export interface ExerciseSeed {
  name: string
  category: string
  muscles: string[]
  equipment: string[]
  type: ExerciseResultType
  instructions?: string
}

/** Base local exercise library (§11) — no images/video required for MVP. */
export const exerciseSeeds: ExerciseSeed[] = [
  { name: 'Squat', category: 'strength', muscles: ['quads', 'glutes'], equipment: [], type: 'reps' },
  { name: 'Push-up', category: 'strength', muscles: ['chest', 'triceps', 'shoulders'], equipment: [], type: 'reps' },
  {
    name: 'Bent-over Row',
    category: 'strength',
    muscles: ['back', 'biceps'],
    equipment: ['dumbbells'],
    type: 'reps',
  },
  { name: 'Plank', category: 'strength', muscles: ['core'], equipment: [], type: 'time' },
  { name: 'Glute Bridge', category: 'strength', muscles: ['glutes', 'hamstrings'], equipment: [], type: 'reps' },
  { name: 'Lunge', category: 'strength', muscles: ['quads', 'glutes'], equipment: [], type: 'reps' },
  { name: 'Mountain Climbers', category: 'cardio', muscles: ['core', 'shoulders'], equipment: [], type: 'time' },
  { name: 'Jumping Jacks', category: 'cardio', muscles: ['full body'], equipment: [], type: 'time' },
  { name: 'Bicycle Crunch', category: 'strength', muscles: ['core'], equipment: [], type: 'reps' },
  {
    name: 'Deadlift',
    category: 'strength',
    muscles: ['hamstrings', 'back', 'glutes'],
    equipment: ['dumbbells'],
    type: 'reps',
  },
  {
    name: 'Overhead Press',
    category: 'strength',
    muscles: ['shoulders', 'triceps'],
    equipment: ['dumbbells'],
    type: 'reps',
  },
  { name: 'Pull-up', category: 'strength', muscles: ['back', 'biceps'], equipment: ['pull-up bar'], type: 'reps' },
  { name: 'Bicep Curl', category: 'strength', muscles: ['biceps'], equipment: ['dumbbells'], type: 'reps' },
  { name: 'Triceps Dip', category: 'strength', muscles: ['triceps', 'chest'], equipment: ['bench'], type: 'reps' },
  { name: 'Calf Raise', category: 'strength', muscles: ['calves'], equipment: [], type: 'reps' },
  { name: 'Side Plank', category: 'strength', muscles: ['core', 'obliques'], equipment: [], type: 'time' },
  { name: 'Bird Dog', category: 'mobility', muscles: ['core', 'back'], equipment: [], type: 'reps' },
  { name: 'Cat-Cow Stretch', category: 'mobility', muscles: ['spine'], equipment: [], type: 'time' },
  { name: 'Hip Flexor Stretch', category: 'mobility', muscles: ['hips'], equipment: [], type: 'time' },
  {
    name: "World's Greatest Stretch",
    category: 'mobility',
    muscles: ['hips', 'thoracic spine'],
    equipment: [],
    type: 'reps',
  },
  { name: 'Thoracic Rotation', category: 'mobility', muscles: ['thoracic spine'], equipment: [], type: 'reps' },
  { name: 'Ankle Mobility Drill', category: 'mobility', muscles: ['ankles'], equipment: [], type: 'reps' },
  { name: 'Walking', category: 'cardio', muscles: ['legs'], equipment: [], type: 'distance' },
  { name: 'Running', category: 'cardio', muscles: ['legs'], equipment: [], type: 'distance' },
  { name: 'Stationary Bike', category: 'cardio', muscles: ['legs'], equipment: ['bike'], type: 'distance' },
  { name: 'Step-up', category: 'strength', muscles: ['quads', 'glutes'], equipment: ['bench'], type: 'reps' },
  { name: 'Superman', category: 'strength', muscles: ['lower back'], equipment: [], type: 'reps' },
]
