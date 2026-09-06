<script setup lang="ts">
import { IonButton, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, alertController, modalController } from '@ionic/vue'
import { ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { recipeRepository } from '@/database/repositories'
import type { NutritionSnapshot, Recipe } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import RecipeFormModal from './components/RecipeFormModal.vue'

const toast = useToast()
const recipes = useLiveQuery(() => recipeRepository.getAll(), [] as Recipe[])
const previews = ref<Record<string, NutritionSnapshot>>({})

async function loadPreview(recipe: Recipe) {
  if (previews.value[recipe.id]) return
  previews.value[recipe.id] = await recipeRepository.getNutritionPer100g(recipe)
}

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
</script>

<template>
  <IonList>
    <IonItemSliding v-for="recipe in recipes" :key="recipe.id" @ion-drag="loadPreview(recipe)">
      <IonItem :button="true" @click="loadPreview(recipe)">
        <IonLabel>
          <h2>{{ recipe.name }}</h2>
          <p>
            Вес блюда: {{ recipe.totalWeight }} г
            <template v-if="previews[recipe.id]"> · {{ previews[recipe.id].kcal ?? '—' }} ккал/100г</template>
          </p>
        </IonLabel>
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="danger" @click="confirmDelete(recipe)">Удалить</IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
    <IonItem v-if="!recipes.length">
      <IonLabel color="medium">Рецептов пока нет</IonLabel>
    </IonItem>
  </IonList>

  <div class="ion-padding">
    <IonButton expand="block" @click="openCreateForm">+ Новый рецепт</IonButton>
  </div>
</template>
