import { z } from 'zod'

export const habitFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название'),
  schedule: z.enum(['daily', 'weekly']),
  targetPerPeriod: z.number().int().positive('Укажите цель больше нуля'),
})
