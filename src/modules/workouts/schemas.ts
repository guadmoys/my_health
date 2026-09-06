import { z } from 'zod'

export const workoutFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название'),
  category: z.string().trim().min(1, 'Введите категорию'),
  description: z.string().trim().optional(),
  estimatedMinutes: z.number().positive().optional(),
})

export const workoutExerciseFormSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().positive('Укажите количество подходов'),
  repsMin: z.number().int().positive().optional(),
  repsMax: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  distance: z.number().positive().optional(),
  restSeconds: z.number().min(0),
  targetWeight: z.number().min(0).optional(),
})
