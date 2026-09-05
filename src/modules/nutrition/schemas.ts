import { z } from 'zod'

export const foodFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название'),
  category: z.string().trim().min(1, 'Введите категорию'),
  kcalPer100: z.number().min(0).optional(),
  proteinPer100: z.number().min(0).optional(),
  fatPer100: z.number().min(0).optional(),
  carbsPer100: z.number().min(0).optional(),
  fiberPer100: z.number().min(0).optional(),
  defaultPortion: z.number().min(0).optional(),
  defaultUnit: z.enum(['g', 'ml', 'pcs', 'portion']),
})

export type FoodFormInput = z.input<typeof foodFormSchema>

export const mealItemFormSchema = z.object({
  amount: z.number().positive('Укажите количество больше нуля'),
  unit: z.enum(['g', 'ml', 'pcs', 'portion']),
})

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название'),
  totalWeight: z.number().positive('Укажите итоговый вес блюда'),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().min(1),
        amount: z.number().positive(),
        unit: z.enum(['g', 'ml', 'pcs', 'portion']),
      }),
    )
    .min(1, 'Добавьте хотя бы один ингредиент'),
})
