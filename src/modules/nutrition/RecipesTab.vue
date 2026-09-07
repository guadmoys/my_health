<script setup lang="ts">
import { IonIcon, actionSheetController, alertController, modalController } from '@ionic/vue'
import { ellipsisHorizontal, restaurantOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'

import { Badge, EmptyState, EntityCard, FabButton } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { recipeRepository } from '@/database/repositories'
import type { NutritionSnapshot, Recipe } from '@/database/types'
import { stringHue } from '@/utils/color'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import RecipeFormModal from './components/RecipeFormModal.vue'

const toast = useToast()
const recipes = useLiveQuery(() => recipeRepository.getAll(), [] as Recipe[])
const previews = ref<Record<string, NutritionSnapshot>>({})

watch(
  recipes,
  async (list) => {
    for (const recipe of list) {
      if (previews.value[recipe.id]) continue
      previews.value[recipe.id] = await recipeRepository.getNutritionPer100g(recipe)
    }
  },
  { immediate: true },
)

interface RecipeFormResult {
  name: string
  totalWeight: number
  ingredients: { food: { id: string }; amount: number; unit: 'g' | 'ml' | 'pcs' | 'portion' }[]
}

async function openCreateForm() {
  const modal = await modalController.create({ component: RecipeFormModal })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<RecipeFormResult>()
  if (role !== 'confirm' || !data) return

  const recipe: Recipe = { id: createId(), name: data.name, totalWeight: data.totalWeight, createdAt: nowIso() }
  await recipeRepository.createWithIngredients(
    recipe,
    data.ingredients.map((ing) => ({
      id: createId(),
      recipeId: recipe.id,
      foodId: ing.food.id,
      amount: ing.amount,
      unit: ing.unit,
    })),
  )
  await toast.success('Рецепт сохранён')
}

async function confirmDelete(recipe: Recipe) {
  const alert = await alertController.create({
    header: 'Удалить рецепт?',
    message: `«${recipe.name}» будет удалён. Уже записанные приёмы пищи не изменятся.`,
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      { text: 'Удалить', role: 'destructive', handler: () => void recipeRepository.delete(recipe.id) },
    ],
  })
  await alert.present()
}

async function openActions(recipe: Recipe) {
  const sheet = await actionSheetController.create({
    header: recipe.name,
    buttons: [
      { text: 'Удалить', role: 'destructive', handler: () => confirmDelete(recipe) },
      { text: 'Отмена', role: 'cancel' },
    ],
  })
  await sheet.present()
}
</script>

<template>
  <div class="wrap">
    <div v-if="recipes.length" class="grid">
      <EntityCard
        v-for="recipe in recipes"
        :key="recipe.id"
        :avatar-text="recipe.name.charAt(0).toUpperCase()"
        :avatar-hue="stringHue(recipe.name)"
        :clickable="false"
      >
        <template #title>{{ recipe.name }}</template>
        <template #subtitle>Вес блюда: {{ recipe.totalWeight }} г</template>
        <template #trailing>
          <button type="button" class="icon-btn" aria-label="Действия" @click.stop="openActions(recipe)">
            <IonIcon :icon="ellipsisHorizontal" aria-hidden="true" />
          </button>
        </template>
        <template v-if="previews[recipe.id]" #footer>
          <Badge tone="accent">{{ previews[recipe.id].kcal ?? '—' }} ккал / 100г</Badge>
        </template>
      </EntityCard>
    </div>

    <EmptyState v-else :icon="restaurantOutline" title="Рецептов пока нет" note="Соберите первый рецепт из продуктов кнопкой ниже." />

    <FabButton @click="openCreateForm">Рецепт</FabButton>
  </div>
</template>

<style scoped>
.wrap {
  padding: 12px 16px 96px;
}

.grid {
  display: grid;
  gap: 10px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  padding: 4px;
  cursor: pointer;
  display: flex;
}
</style>
