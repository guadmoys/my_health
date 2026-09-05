import Dexie, { type EntityTable } from 'dexie'

import type {
  Achievement,
  ActivityLog,
  BodyMeasurement,
  CycleLog,
  DailyStats,
  Exercise,
  ExerciseSession,
  Food,
  Goal,
  Habit,
  HabitLog,
  Meal,
  MealItem,
  Note,
  Profile,
  Program,
  ProgramDay,
  ProgramWeek,
  Recipe,
  RecipeIngredient,
  SetLog,
  Setting,
  SleepLog,
  WaterLog,
  WeightLog,
  WellbeingLog,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from './types'

export class VitaDatabase extends Dexie {
  profiles!: EntityTable<Profile, 'id'>
  goals!: EntityTable<Goal, 'id'>
  foods!: EntityTable<Food, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  recipeIngredients!: EntityTable<RecipeIngredient, 'id'>
  meals!: EntityTable<Meal, 'id'>
  mealItems!: EntityTable<MealItem, 'id'>
  waterLogs!: EntityTable<WaterLog, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>
  programs!: EntityTable<Program, 'id'>
  programWeeks!: EntityTable<ProgramWeek, 'id'>
  programDays!: EntityTable<ProgramDay, 'id'>
  workoutSessions!: EntityTable<WorkoutSession, 'id'>
  exerciseSessions!: EntityTable<ExerciseSession, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  weights!: EntityTable<WeightLog, 'id'>
  bodyMeasurements!: EntityTable<BodyMeasurement, 'id'>
  sleepLogs!: EntityTable<SleepLog, 'id'>
  activityLogs!: EntityTable<ActivityLog, 'id'>
  wellbeingLogs!: EntityTable<WellbeingLog, 'id'>
  cycleLogs!: EntityTable<CycleLog, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  notes!: EntityTable<Note, 'id'>
  achievements!: EntityTable<Achievement, 'id'>
  dailyStats!: EntityTable<DailyStats, 'date'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'vita') {
    super(name)

    // v1 schema — see Таблица 28 of the technical specification.
    // Note: `favorite`/`active` are boolean fields kept in the index list for
    // parity with the spec, but IndexedDB cannot use booleans as index keys —
    // repositories must filter these in memory rather than via `.where()`.
    this.version(1).stores({
      profiles: 'id',
      goals: 'id, status, type',
      foods: 'id, name, favorite',
      recipes: 'id, name',
      recipeIngredients: 'id, recipeId, foodId',
      meals: 'id, date, type',
      mealItems: 'id, mealId',
      waterLogs: 'id, date',
      exercises: 'id, name, category',
      workouts: 'id, name, category',
      workoutExercises: 'id, workoutId, position',
      programs: 'id, name',
      programWeeks: 'id, programId, weekIndex',
      programDays: 'id, weekId, dayOfWeek',
      workoutSessions: 'id, date, workoutId, status',
      exerciseSessions: 'id, sessionId, exerciseId',
      setLogs: 'id, exerciseSessionId',
      weights: 'id, date',
      bodyMeasurements: 'id, date, type',
      sleepLogs: 'id, date',
      activityLogs: 'id, date, type',
      wellbeingLogs: 'id, date',
      cycleLogs: 'id, date',
      habits: 'id, active',
      habitLogs: 'id, habitId, date, [habitId+date]',
      notes: 'id, date',
      achievements: 'id, unlockedAt',
      dailyStats: 'date',
      settings: 'key',
    })
  }
}

export const db = new VitaDatabase()
