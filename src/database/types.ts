/**
 * Domain types for the VITA local-first database.
 * `DateString` is a calendar day in 'YYYY-MM-DD' form (used for indexing/grouping by day).
 * `DateTimeString` is a full ISO-8601 timestamp.
 */
export type DateString = string
export type DateTimeString = string

export type Sex = 'female' | 'male' | 'unspecified'
export type Units = 'metric' | 'imperial'
export type NutritionDisplayMode = 'full' | 'simplified' | 'hidden'
export type Theme = 'light' | 'dark' | 'system'

export interface Profile {
  id: string
  name?: string
  birthDate?: DateString
  sex?: Sex
  heightCm?: number
  units: Units
  nutritionDisplayMode: NutritionDisplayMode
  weekStartsOn: 0 | 1
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

// --- Goals (§8, Таблица 8-9) ---

export type GoalType =
  | 'maintenance'
  | 'weight_loss'
  | 'weight_gain'
  | 'strength'
  | 'activity'
  | 'habit'
  | 'custom'

export type GoalStatus = 'active' | 'completed' | 'archived'

export interface Goal {
  id: string
  type: GoalType
  title: string
  description?: string
  isPrimary: boolean
  status: GoalStatus
  targetValue?: number
  targetUnit?: string
  targetDate?: DateString
  metricLabel?: string
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

// --- Nutrition (§9, Таблица 10-12) ---

export type PortionUnit = 'g' | 'ml' | 'pcs' | 'portion'

export interface Food {
  id: string
  name: string
  category: string
  kcalPer100?: number
  proteinPer100?: number
  fatPer100?: number
  carbsPer100?: number
  fiberPer100?: number
  defaultPortion?: number
  defaultUnit: PortionUnit
  favorite: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface Recipe {
  id: string
  name: string
  totalWeight: number
  createdAt: DateTimeString
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  foodId: string
  amount: number
  unit: PortionUnit
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  date: DateString
  type: MealType
  time?: string
  note?: string
  createdAt: DateTimeString
}

export interface NutritionSnapshot {
  kcal?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
}

export interface MealItem {
  id: string
  mealId: string
  foodId?: string
  recipeId?: string
  nameSnapshot: string
  amount: number
  unit: PortionUnit
  /** Frozen at entry time so later edits to the Food/Recipe never rewrite eaten history. */
  nutritionSnapshot: NutritionSnapshot
}

export interface WaterLog {
  id: string
  date: DateString
  amountMl: number
  createdAt: DateTimeString
}

// --- Exercises (§11, Таблица 13) ---

export type ExerciseResultType = 'reps' | 'time' | 'distance'

export interface Exercise {
  id: string
  name: string
  category: string
  muscles: string[]
  equipment: string[]
  instructions?: string
  type: ExerciseResultType
  custom: boolean
  archived: boolean
  createdAt: DateTimeString
}

// --- Workouts (§12-14, Таблица 14-16) ---

export interface Workout {
  id: string
  name: string
  category: string
  description?: string
  estimatedMinutes?: number
  archived: boolean
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  position: number
  sets: number
  repsMin?: number
  repsMax?: number
  durationSeconds?: number
  distance?: number
  restSeconds: number
  targetWeight?: number
}

export type WorkoutSessionStatus = 'active' | 'completed' | 'abandoned'

export interface WorkoutSession {
  id: string
  workoutId: string
  date: DateString
  startedAt: DateTimeString
  finishedAt?: DateTimeString
  status: WorkoutSessionStatus
  totalVolume?: number
  totalDurationSeconds?: number
}

export interface ExerciseSession {
  id: string
  sessionId: string
  exerciseId: string
  position: number
  startedAt?: DateTimeString
  finishedAt?: DateTimeString
}

export interface SetLog {
  id: string
  exerciseSessionId: string
  setIndex: number
  reps?: number
  weight?: number
  durationSeconds?: number
  distance?: number
  completedAt: DateTimeString
  restSecondsUsed?: number
}

// --- Programs (§15, Таблица 17-18) ---

export interface Program {
  id: string
  name: string
  goalType: GoalType
  description: string
  weeksCount?: number
  custom: boolean
}

export interface ProgramWeek {
  id: string
  programId: string
  weekIndex: number
}

export type ProgramDayType = 'workout' | 'rest'

export interface ProgramDay {
  id: string
  weekId: string
  dayOfWeek: number
  workoutId?: string
  type: ProgramDayType
}

// --- Weight & measurements (§17, Таблица 19) ---

export interface WeightLog {
  id: string
  date: DateString
  value: number
  note?: string
  /** Tie-breaks same-day entries (e.g. a corrected re-weigh) so "latest" is unambiguous. */
  createdAt: DateTimeString
}

export type BodyMeasurementType = 'waist' | 'chest' | 'hips' | 'arm' | 'thigh' | 'neck' | 'custom'

export interface BodyMeasurement {
  id: string
  date: DateString
  type: BodyMeasurementType
  value: number
  unit: string
}

// --- Sleep (§18, Таблица 20) ---

export interface SleepLog {
  id: string
  date: DateString
  startTime?: DateTimeString
  endTime?: DateTimeString
  durationMinutes: number
  quality?: 1 | 2 | 3 | 4 | 5
}

// --- Activity (§19, Таблица 21) ---

export type ActivityType = 'steps' | 'walk' | 'run' | 'bike' | 'swim' | 'other'

export interface ActivityLog {
  id: string
  date: DateString
  type: ActivityType
  value?: number
  durationMinutes?: number
  distance?: number
  note?: string
}

// --- Wellbeing (§20, Таблица 22) ---

export interface WellbeingLog {
  id: string
  date: DateString
  energy?: 1 | 2 | 3 | 4 | 5
  mood?: 1 | 2 | 3 | 4 | 5
  fatigue?: 1 | 2 | 3 | 4 | 5
  discomfort: boolean
  note?: string
}

// --- Habits (§21, Таблица 23) ---

export type HabitSchedule = 'daily' | 'weekly'

export interface Habit {
  id: string
  name: string
  schedule: HabitSchedule
  targetPerPeriod: number
  active: boolean
  createdAt: DateTimeString
}

export interface HabitLog {
  id: string
  habitId: string
  date: DateString
  value?: number
  completed: boolean
}

// --- Notes (§22) ---

export interface Note {
  id: string
  date: DateString
  text: string
  createdAt: DateTimeString
}

// --- Achievements (§23) ---

export interface Achievement {
  id: string
  key: string
  unlockedAt: DateTimeString
}

// --- DailyStats (§27, Таблица 27) ---

export interface DailyStats {
  date: DateString
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  waterMl?: number
  workoutMinutes?: number
  workoutCount?: number
  steps?: number
  activityMinutes?: number
  sleepMinutes?: number
  weight?: number
  habitsCompleted?: number
  habitsPlanned?: number
}

// --- Settings (§33, Таблица 32) ---

export interface Setting {
  key: string
  value: unknown
}
