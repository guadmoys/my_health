export interface WorkoutExerciseSeed {
  exerciseName: string
  sets: number
  repsMin?: number
  repsMax?: number
  durationSeconds?: number
  restSeconds: number
}

export interface WorkoutSeed {
  /** Stable key programs.seed.ts uses to reference this workout — never shown to the user. */
  key: string
  name: string
  category: string
  description?: string
  estimatedMinutes?: number
  exercises: WorkoutExerciseSeed[]
}

/** Workout templates behind the preset programs (Таблица 18). */
export const workoutSeeds: WorkoutSeed[] = [
  {
    key: 'full-body-start',
    name: 'Full Body — старт',
    category: 'strength',
    description: 'Базовая тренировка на всё тело для начала пути.',
    estimatedMinutes: 35,
    exercises: [
      { exerciseName: 'Squat', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
      { exerciseName: 'Push-up', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Bent-over Row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Glute Bridge', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
      { exerciseName: 'Plank', sets: 3, durationSeconds: 40, restSeconds: 45 },
    ],
  },
  {
    key: 'home-no-equipment',
    name: 'Дом без оборудования',
    category: 'bodyweight',
    description: 'Домашняя тренировка без инвентаря.',
    estimatedMinutes: 30,
    exercises: [
      { exerciseName: 'Jumping Jacks', sets: 3, durationSeconds: 40, restSeconds: 30 },
      { exerciseName: 'Squat', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
      { exerciseName: 'Push-up', sets: 3, repsMin: 8, repsMax: 15, restSeconds: 45 },
      { exerciseName: 'Lunge', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 45 },
      { exerciseName: 'Mountain Climbers', sets: 3, durationSeconds: 30, restSeconds: 30 },
      { exerciseName: 'Plank', sets: 3, durationSeconds: 40, restSeconds: 45 },
    ],
  },
  {
    key: 'general-fitness',
    name: 'Общая форма',
    category: 'general',
    description: 'Умеренная тренировка для общей активности.',
    estimatedMinutes: 30,
    exercises: [
      { exerciseName: 'Jumping Jacks', sets: 3, durationSeconds: 30, restSeconds: 30 },
      { exerciseName: 'Squat', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
      { exerciseName: 'Push-up', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 45 },
      { exerciseName: 'Bicycle Crunch', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
      { exerciseName: 'Plank', sets: 3, durationSeconds: 40, restSeconds: 45 },
    ],
  },
  {
    key: 'mobility',
    name: 'Мобильность',
    category: 'mobility',
    description: 'Короткое занятие на подвижность суставов и позвоночника.',
    estimatedMinutes: 15,
    exercises: [
      { exerciseName: 'Cat-Cow Stretch', sets: 2, durationSeconds: 40, restSeconds: 15 },
      { exerciseName: 'Hip Flexor Stretch', sets: 2, durationSeconds: 30, restSeconds: 15 },
      { exerciseName: "World's Greatest Stretch", sets: 2, repsMin: 5, repsMax: 5, restSeconds: 20 },
      { exerciseName: 'Thoracic Rotation', sets: 2, repsMin: 8, repsMax: 10, restSeconds: 20 },
      { exerciseName: 'Ankle Mobility Drill', sets: 2, repsMin: 10, repsMax: 10, restSeconds: 15 },
    ],
  },
  {
    key: 'upper-body',
    name: 'Верх (Push/Pull)',
    category: 'strength',
    description: 'Продвинутый шаблон: верхняя часть тела.',
    estimatedMinutes: 40,
    exercises: [
      { exerciseName: 'Push-up', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Bent-over Row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Overhead Press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseName: 'Pull-up', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90 },
      { exerciseName: 'Bicep Curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Triceps Dip', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 },
    ],
  },
  {
    key: 'lower-body',
    name: 'Низ (Ноги)',
    category: 'strength',
    description: 'Продвинутый шаблон: нижняя часть тела.',
    estimatedMinutes: 40,
    exercises: [
      { exerciseName: 'Squat', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseName: 'Deadlift', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseName: 'Lunge', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Step-up', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseName: 'Calf Raise', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
      { exerciseName: 'Glute Bridge', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
    ],
  },
]
