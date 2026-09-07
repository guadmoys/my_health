import { z } from 'zod'

export const medicineFormSchema = z.object({
  category: z.string().trim().min(1, 'Укажите симптом или категорию'),
  name: z.string().trim().min(1, 'Введите название лекарства'),
  link: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^https?:\/\//i.test(v), 'Ссылка должна начинаться с http:// или https://'),
  comment: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  effect: z.enum(['helped', 'not_helped', 'unknown']),
})

export type MedicineFormOutput = z.output<typeof medicineFormSchema>
