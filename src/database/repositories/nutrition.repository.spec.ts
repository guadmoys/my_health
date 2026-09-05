import { beforeEach, describe, expect, it } from 'vitest'

import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Food } from '../types'
import { computeNutritionSnapshot, mealRepository } from './nutrition.repository'

describe('nutrition repository', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([db.meals.clear(), db.mealItems.clear(), db.foods.clear(), db.dailyStats.clear()])
  })

  const food: Food = {
    id: 'food-1',
    name: 'Chicken breast',
    category: 'meat',
    kcalPer100: 165,
    proteinPer100: 31,
    fatPer100: 3.6,
    carbsPer100: 0,
    defaultUnit: 'g',
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it('computes a nutrition snapshot proportional to the portion', () => {
    const snapshot = computeNutritionSnapshot(food, 150, 'g')
    expect(snapshot.kcal).toBeCloseTo(247.5)
    expect(snapshot.protein).toBeCloseTo(46.5)
  })

  it('creates a meal with its items in one transaction, freezing the snapshot', async () => {
    const meal = {
      id: createId(),
      date: today(),
      type: 'lunch' as const,
      createdAt: new Date().toISOString(),
    }
    const item = {
      id: createId(),
      mealId: meal.id,
      foodId: food.id,
      nameSnapshot: food.name,
      amount: 150,
      unit: 'g' as const,
      nutritionSnapshot: computeNutritionSnapshot(food, 150, 'g'),
    }

    await mealRepository.createWithItems(meal, [item])

    const items = await mealRepository.getItemsForDate(today())
    expect(items).toHaveLength(1)
    expect(items[0].nutritionSnapshot.kcal).toBeCloseTo(247.5)

    const stats = await db.dailyStats.get(today())
    expect(stats?.calories).toBe(248)

    // Editing the food dictionary afterwards must not rewrite already-eaten history.
    await db.foods.add(food)
    await db.foods.update(food.id, { kcalPer100: 999 })
    const itemsAfterEdit = await mealRepository.getItemsForDate(today())
    expect(itemsAfterEdit[0].nutritionSnapshot.kcal).toBeCloseTo(247.5)
  })
})
