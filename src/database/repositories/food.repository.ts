import { db } from '../db'
import type { Food, Recipe, RecipeIngredient } from '../types'
import { BaseRepository } from './base.repository'

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
