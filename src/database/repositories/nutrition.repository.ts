import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { Food, Meal, MealItem, MealType, NutritionSnapshot, PortionUnit } from '../types'

/**
 * Per-100 fields are per 100g/100ml. For 'pcs'/'portion', `amount` is a piece
 * count that first converts to grams via the food's defaultPortion.
 */
export function toGrams(food: Pick<Food, 'defaultPortion'>, amount: number, unit: PortionUnit): number {
  const isCountUnit = unit === 'pcs' || unit === 'portion'
  return isCountUnit ? amount * (food.defaultPortion ?? 100) : amount
}

export function computeNutritionSnapshot(food: Food, amount: number, unit: PortionUnit): NutritionSnapshot {
  const ratio = toGrams(food, amount, unit) / 100
  return {
    kcal: food.kcalPer100 !== undefined ? round1(food.kcalPer100 * ratio) : undefined,
    protein: food.proteinPer100 !== undefined ? round1(food.proteinPer100 * ratio) : undefined,
    fat: food.fatPer100 !== undefined ? round1(food.fatPer100 * ratio) : undefined,
    carbs: food.carbsPer100 !== undefined ? round1(food.carbsPer100 * ratio) : undefined,
    fiber: food.fiberPer100 !== undefined ? round1(food.fiberPer100 * ratio) : undefined,
  }
}

/** Scales an already-computed per-100g snapshot (food or recipe) to a portion in grams. */
export function scalePer100g(per100g: NutritionSnapshot, grams: number): NutritionSnapshot {
  const ratio = grams / 100
  return {
    kcal: per100g.kcal !== undefined ? round1(per100g.kcal * ratio) : undefined,
    protein: per100g.protein !== undefined ? round1(per100g.protein * ratio) : undefined,
    fat: per100g.fat !== undefined ? round1(per100g.fat * ratio) : undefined,
    carbs: per100g.carbs !== undefined ? round1(per100g.carbs * ratio) : undefined,
    fiber: per100g.fiber !== undefined ? round1(per100g.fiber * ratio) : undefined,
  }
}

/**
 * Recipe nutrition per 100g of the finished dish. `totalWeight` is the
 * user-entered final dish weight (not the sum of ingredient amounts —
 * cooking changes weight), per §9.3.
 */
export function computeRecipeNutritionPer100g(
  ingredients: { food: Food; amount: number; unit: PortionUnit }[],
  totalWeight: number,
): NutritionSnapshot {
  const totals = ingredients.reduce(
    (acc, { food, amount, unit }) => {
      const snapshot = computeNutritionSnapshot(food, amount, unit)
      acc.kcal += snapshot.kcal ?? 0
      acc.protein += snapshot.protein ?? 0
      acc.fat += snapshot.fat ?? 0
      acc.carbs += snapshot.carbs ?? 0
      acc.fiber += snapshot.fiber ?? 0
      return acc
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
  )
  if (!totalWeight) return {}
  const ratio = 100 / totalWeight
  return {
    kcal: round1(totals.kcal * ratio),
    protein: round1(totals.protein * ratio),
    fat: round1(totals.fat * ratio),
    carbs: round1(totals.carbs * ratio),
    fiber: round1(totals.fiber * ratio),
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

class MealRepository {
  async getByDate(date: string): Promise<Meal[]> {
    return db.meals.where('date').equals(date).toArray()
  }

  async getItems(mealId: string): Promise<MealItem[]> {
    return db.mealItems.where('mealId').equals(mealId).toArray()
  }

  async getItemsForDate(date: string): Promise<MealItem[]> {
    const meals = await this.getByDate(date)
    if (!meals.length) return []
    return db.mealItems.where('mealId').anyOf(meals.map((m) => m.id)).toArray()
  }

  /** Meal + its items are created in one transaction (§29); items freeze a nutritionSnapshot. */
  async createWithItems(meal: Meal, items: MealItem[]): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.meals.add(meal)
      await db.mealItems.bulkAdd(items)
      await recalculateDailyStats(db, meal.date)
    })
  }

  /** Adds one item to the day's meal of this type, creating that meal slot if it doesn't exist yet. */
  async addItemToSlot(
    date: string,
    type: MealType,
    item: Omit<MealItem, 'id' | 'mealId'> & { id: string },
  ): Promise<void> {
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      const existing = await db.meals.where('date').equals(date).toArray()
      let meal = existing.find((m) => m.type === type)
      if (!meal) {
        meal = { id: createId(), date, type, createdAt: nowIso() }
        await db.meals.add(meal)
      }
      await db.mealItems.add({ ...item, mealId: meal.id })
      await recalculateDailyStats(db, date)
    })
  }

  /** Removes one item; if that was the meal's last item, the (now empty) meal is removed too. */
  async deleteItem(itemId: string): Promise<void> {
    const item = await db.mealItems.get(itemId)
    if (!item) return
    const meal = await db.meals.get(item.mealId)
    if (!meal) return

    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.mealItems.delete(itemId)
      const remaining = await db.mealItems.where('mealId').equals(meal.id).count()
      if (remaining === 0) {
        await db.meals.delete(meal.id)
      }
      await recalculateDailyStats(db, meal.date)
    })
  }

  async deleteMeal(id: string): Promise<void> {
    const meal = await db.meals.get(id)
    if (!meal) return
    await db.transaction('rw', dailyStatsSourceTables(db), async () => {
      await db.mealItems.where('mealId').equals(id).delete()
      await db.meals.delete(id)
      await recalculateDailyStats(db, meal.date)
    })
  }
}

export const mealRepository = new MealRepository()
