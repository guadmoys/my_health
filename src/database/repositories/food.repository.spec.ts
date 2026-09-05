import { beforeEach, describe, expect, it } from 'vitest'

import { today, toDateString } from '@/utils/date'
import { createId } from '@/utils/id'

import { db } from '../db'
import type { Food } from '../types'
import { foodRepository } from './food.repository'
import { computeNutritionSnapshot, mealRepository } from './nutrition.repository'

describe('foodRepository.getRecent', () => {
  beforeEach(async () => {
    await db.open()
    await Promise.all([db.foods.clear(), db.meals.clear(), db.mealItems.clear(), db.dailyStats.clear()])
  })

  const makeFood = (id: string, name: string): Food => ({
    id,
    name,
    category: 'test',
    kcalPer100: 100,
    defaultUnit: 'g',
    favorite: false,
    createdAt: '',
    updatedAt: '',
  })

  it('returns foods most-recently logged first, deduplicated', async () => {
    const apple = makeFood('apple', 'Apple')
    const bread = makeFood('bread', 'Bread')
    await db.foods.bulkAdd([apple, bread])

    const yesterday = toDateString(new Date(Date.now() - 86_400_000))
    const wait = () => new Promise((resolve) => setTimeout(resolve, 5))

    await mealRepository.addItemToSlot(yesterday, 'breakfast', {
      id: createId(),
      foodId: bread.id,
      nameSnapshot: bread.name,
      amount: 50,
      unit: 'g',
      nutritionSnapshot: computeNutritionSnapshot(bread, 50, 'g'),
    })
    await wait()
    await mealRepository.addItemToSlot(today(), 'breakfast', {
      id: createId(),
      foodId: apple.id,
      nameSnapshot: apple.name,
      amount: 100,
      unit: 'g',
      nutritionSnapshot: computeNutritionSnapshot(apple, 100, 'g'),
    })
    await wait()
    // Logging bread again today shouldn't duplicate it in the recent list.
    await mealRepository.addItemToSlot(today(), 'lunch', {
      id: createId(),
      foodId: bread.id,
      nameSnapshot: bread.name,
      amount: 30,
      unit: 'g',
      nutritionSnapshot: computeNutritionSnapshot(bread, 30, 'g'),
    })

    // Bread was logged last (today's lunch), so it ranks above apple (today's
    // breakfast) despite apple's meal being created first.
    const recent = await foodRepository.getRecent()
    expect(recent.map((f) => f.id)).toEqual(['bread', 'apple'])
  })
})
