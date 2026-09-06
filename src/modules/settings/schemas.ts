import { z } from 'zod'

export const profileFormSchema = z.object({
  name: z.string().trim().max(100).optional(),
  sex: z.enum(['female', 'male', 'unspecified']),
  heightCm: z.number().positive('Рост должен быть больше нуля').optional(),
  units: z.enum(['metric', 'imperial']),
  nutritionDisplayMode: z.enum(['full', 'simplified', 'hidden']),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
})
