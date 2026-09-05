import { dailyStatsSourceTables, recalculateDailyStats } from '../aggregates'
import { db } from '../db'
import type { Food, Meal, MealItem, NutritionSnapshot, PortionUnit } from '../types'

export function computeNutritionSnapshot(food: Food, amount: number, unit: PortionUnit): NutritionSnapshot {
  // Per-100 fields are per 100g/100ml. For 'pcs'/'portion', `amount` is a
  // piece count that first converts to grams via the food's defaultPortion.
  const isCountUnit = unit === 'pcs' || unit === 'portion'
  const grams = isCountUnit ? amount * (food.defaultPortion ?? 100) : amount
  const ratio = grams / 100
  return {
    kcal: food.kcalPer100 !== undefined ? round1(food.kcalPer100 * ratio) : undefined,
    protein: food.proteinPer100 !== undefined ? round1(food.proteinPer100 * ratio) : undefined,
    fat: food.fatPer100 !== undefined ? round1(food.fatPer100 * ratio) : undefined,
    carbs: food.carbsPer100 !== undefined ? round1(food.carbsPer100 * ratio) : undefined,
    fiber: food.fiberPer100 !== undefined ? round1(food.fiberPer100 * ratio) : undefined,
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
