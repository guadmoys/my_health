import { db } from '../db'
import type { Food, NutritionSnapshot, Recipe, RecipeIngredient } from '../types'
import { BaseRepository } from './base.repository'
import { computeRecipeNutritionPer100g } from './nutrition.repository'

class FoodRepository extends BaseRepository<Food> {
  constructor() {
    super(db.foods)
  }

  async search(query: string): Promise<Food[]> {
    const q = query.trim().toLowerCase()
    if (!q) return this.table.toArray()
    return this.table.filter((f) => f.name.toLowerCase().includes(q)).toArray()
  }

  async getFavorites(): Promise<Food[]> {
    return this.table.filter((f) => f.favorite).toArray()
  }

  /** Foods used in the most recently logged meals, most recent first, deduplicated. */
  async getRecent(limit = 10): Promise<Food[]> {
    const recentMeals = (await db.meals.orderBy('date').reverse().limit(200).toArray())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
    if (!recentMeals.length) return []

    const mealRecencyById = new Map(recentMeals.map((m, index) => [m.id, index]))
    const items = await db.mealItems.where('mealId').anyOf(recentMeals.map((m) => m.id)).toArray()
    const itemsByRecency = items
      .filter((i) => i.foodId)
      .sort((a, b) => (mealRecencyById.get(a.mealId) ?? Infinity) - (mealRecencyById.get(b.mealId) ?? Infinity))

    const orderedFoodIds: string[] = []
    const seen = new Set<string>()
    for (const item of itemsByRecency) {
      if (item.foodId && !seen.has(item.foodId)) {
        seen.add(item.foodId)
        orderedFoodIds.push(item.foodId)
        if (orderedFoodIds.length >= limit) break
      }
    }

    const foods = await this.table.bulkGet(orderedFoodIds)
    return foods.filter((f): f is Food => !!f)
  }
}

class RecipeRepository {
  async getAll(): Promise<Recipe[]> {
    return db.recipes.toArray()
  }

  async get(id: string): Promise<Recipe | undefined> {
    return db.recipes.get(id)
  }

  async getIngredients(recipeId: string): Promise<RecipeIngredient[]> {
    return db.recipeIngredients.where('recipeId').equals(recipeId).toArray()
  }

  /** Computed from ingredients each time — a Recipe stores no nutrition fields of its own. */
  async getNutritionPer100g(recipe: Recipe): Promise<NutritionSnapshot> {
    const ingredients = await this.getIngredients(recipe.id)
    if (!ingredients.length) return {}
    const foods = await db.foods.bulkGet(ingredients.map((i) => i.foodId))
    const resolved = ingredients
      .map((ing, index) => {
        const food = foods[index]
        return food ? { food, amount: ing.amount, unit: ing.unit } : undefined
      })
      .filter((x): x is { food: Food; amount: number; unit: RecipeIngredient['unit'] } => !!x)
    return computeRecipeNutritionPer100g(resolved, recipe.totalWeight)
  }

  /** Recipe + its ingredient rows are created together (§29). */
  async createWithIngredients(recipe: Recipe, ingredients: RecipeIngredient[]): Promise<void> {
    await db.transaction('rw', db.recipes, db.recipeIngredients, async () => {
      await db.recipes.add(recipe)
      await db.recipeIngredients.bulkAdd(ingredients)
    })
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.recipes, db.recipeIngredients, async () => {
      await db.recipeIngredients.where('recipeId').equals(id).delete()
      await db.recipes.delete(id)
    })
  }
}

export const foodRepository = new FoodRepository()
export const recipeRepository = new RecipeRepository()
