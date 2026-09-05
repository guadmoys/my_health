import type { GoalType } from '../types'

export interface ProgramDaySeed {
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  dayOfWeek: number
  workoutKey?: string
}

export interface ProgramSeed {
  name: string
  goalType: GoalType
  description: string
  weeksCount: number
  /** One week's pattern, repeated for `weeksCount` weeks. */
  days: ProgramDaySeed[]
}

const rest = (dayOfWeek: number): ProgramDaySeed => ({ dayOfWeek })

/** Preset programs (Таблица 18) — plain data, not hardcoded into components (§15). */
export const programSeeds: ProgramSeed[] = [
  {
    name: 'Full Body — старт',
    goalType: 'maintenance',
    description: 'Общая база: 3 раза в неделю на всё тело.',
    weeksCount: 4,
    days: [
      { dayOfWeek: 1, workoutKey: 'full-body-start' },
      rest(2),
      { dayOfWeek: 3, workoutKey: 'full-body-start' },
      rest(4),
      { dayOfWeek: 5, workoutKey: 'full-body-start' },
      rest(6),
      rest(7),
    ],
  },
  {
    name: 'Дом без оборудования',
    goalType: 'activity',
    description: 'Домашние занятия без инвентаря, 3 раза в неделю.',
    weeksCount: 4,
    days: [
      { dayOfWeek: 1, workoutKey: 'home-no-equipment' },
      rest(2),
      { dayOfWeek: 3, workoutKey: 'home-no-equipment' },
      rest(4),
      { dayOfWeek: 5, workoutKey: 'home-no-equipment' },
      rest(6),
      rest(7),
    ],
  },
  {
    name: 'Общая форма',
    goalType: 'maintenance',
    description: 'Умеренная активность, 3 раза в неделю.',
    weeksCount: 4,
    days: [
      { dayOfWeek: 1, workoutKey: 'general-fitness' },
      rest(2),
      { dayOfWeek: 3, workoutKey: 'general-fitness' },
      rest(4),
      { dayOfWeek: 5, workoutKey: 'general-fitness' },
      rest(6),
      rest(7),
    ],
  },
  {
    name: 'Мобильность',
    goalType: 'activity',
    description: 'Короткие ежедневные занятия на подвижность.',
    weeksCount: 4,
    days: [
      { dayOfWeek: 1, workoutKey: 'mobility' },
      { dayOfWeek: 2, workoutKey: 'mobility' },
      { dayOfWeek: 3, workoutKey: 'mobility' },
      { dayOfWeek: 4, workoutKey: 'mobility' },
      { dayOfWeek: 5, workoutKey: 'mobility' },
      rest(6),
      rest(7),
    ],
  },
  {
    name: 'Верх/низ',
    goalType: 'strength',
    description: 'Продвинутый шаблон сплита, 4 раза в неделю.',
    weeksCount: 4,
    days: [
      { dayOfWeek: 1, workoutKey: 'upper-body' },
      { dayOfWeek: 2, workoutKey: 'lower-body' },
      rest(3),
      { dayOfWeek: 4, workoutKey: 'upper-body' },
      { dayOfWeek: 5, workoutKey: 'lower-body' },
      rest(6),
      rest(7),
    ],
  },
]
