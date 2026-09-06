import { beforeEach, describe, expect, it } from 'vitest'

import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Food } from '../types'
import { computeNutritionSnapshot, computeRecipeNutritionPer100g, mealRepository } from './nutrition.repository'

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

  it('addItemToSlot creates the meal slot on first use and reuses it after', async () => {
    await db.foods.add(food)
    const item1 = {
      id: createId(),
      foodId: food.id,
      nameSnapshot: food.name,
      amount: 100,
      unit: 'g' as const,
      nutritionSnapshot: computeNutritionSnapshot(food, 100, 'g'),
    }
    const item2 = { ...item1, id: createId(), amount: 50, nutritionSnapshot: computeNutritionSnapshot(food, 50, 'g') }

    await mealRepository.addItemToSlot(today(), 'breakfast', item1)
    await mealRepository.addItemToSlot(today(), 'breakfast', item2)

    const meals = await mealRepository.getByDate(today())
    expect(meals).toHaveLength(1)
    const items = await mealRepository.getItems(meals[0].id)
    expect(items).toHaveLength(2)
  })

  it('deleteItem removes an empty meal, but keeps it while items remain', async () => {
    await db.foods.add(food)
    const item1 = {
      id: createId(),
      foodId: food.id,
      nameSnapshot: food.name,
      amount: 100,
      unit: 'g' as const,
      nutritionSnapshot: computeNutritionSnapshot(food, 100, 'g'),
    }
    const item2 = { ...item1, id: createId(), amount: 50 }

    await mealRepository.addItemToSlot(today(), 'snack', item1)
    await mealRepository.addItemToSlot(today(), 'snack', item2)

    await mealRepository.deleteItem(item1.id)
    expect(await mealRepository.getByDate(today())).toHaveLength(1)

    await mealRepository.deleteItem(item2.id)
    expect(await mealRepository.getByDate(today())).toHaveLength(0)
  })
})

describe('computeRecipeNutritionPer100g', () => {
  it('scales ingredient totals to the user-entered final dish weight', () => {
    const chicken: Food = {
      id: 'f1',
      name: 'Chicken',
      category: 'meat',
      kcalPer100: 165,
      proteinPer100: 31,
      defaultUnit: 'g',
      favorite: false,
      createdAt: '',
      updatedAt: '',
    }
    const rice: Food = {
      id: 'f2',
      name: 'Rice',
      category: 'grain',
      kcalPer100: 130,
      proteinPer100: 2.7,
      defaultUnit: 'g',
      favorite: false,
      createdAt: '',
      updatedAt: '',
    }

    // 200g chicken + 200g rice cooked down to 350g total dish.
    const snapshot = computeRecipeNutritionPer100g(
      [
        { food: chicken, amount: 200, unit: 'g' },
        { food: rice, amount: 200, unit: 'g' },
      ],
      350,
    )

    // Total kcal = 330 + 260 = 590 over 350g -> 168.6 kcal/100g.
    expect(snapshot.kcal).toBeCloseTo(168.6, 1)
  })

  it('returns an empty snapshot when total weight is zero', () => {
    expect(computeRecipeNutritionPer100g([], 0)).toEqual({})
  })
})
