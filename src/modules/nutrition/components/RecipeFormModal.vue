<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { reactive, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { computeRecipeNutritionPer100g, foodRepository } from '@/database/repositories'
import type { Food, PortionUnit } from '@/database/types'

import { recipeFormSchema } from '../schemas'

interface DraftIngredient {
  food: Food
  amount: number
  unit: PortionUnit
}

const name = ref('')
// IonInput always emits a string via v-model, even for type="number".
const totalWeight = ref<string | number | null>(null)
const totalWeightNumber = () => {
  const n = Number(totalWeight.value)
  return totalWeight.value === null || totalWeight.value === '' || Number.isNaN(n) ? 0 : n
}
const ingredients = ref<DraftIngredient[]>([])
const errors = ref<string[]>([])

const searchQuery = ref('')
const searchResults = useLiveQuery(() => foodRepository.search(searchQuery.value), [] as Food[], [searchQuery])

const draftAmount = reactive<Record<string, number>>({})
const draftUnit = reactive<Record<string, PortionUnit>>({})

function addIngredient(food: Food) {
  const amount = draftAmount[food.id] || 100
  const unit = draftUnit[food.id] ?? food.defaultUnit
  ingredients.value.push({ food, amount, unit })
  searchQuery.value = ''
}

function removeIngredient(index: number) {
  ingredients.value.splice(index, 1)
}

const previewPer100g = () =>
  computeRecipeNutritionPer100g(
    ingredients.value.map((i) => ({ food: i.food, amount: i.amount, unit: i.unit })),
    totalWeightNumber(),
  )

function submit() {
  const result = recipeFormSchema.safeParse({
    name: name.value,
    totalWeight: totalWeightNumber(),
    ingredients: ingredients.value.map((i) => ({ foodId: i.food.id, amount: i.amount, unit: i.unit })),
  })

  if (!result.success) {
    errors.value = result.error.issues.map((i) => i.message)
    return
  }

  modalController.dismiss(
    { name: result.data.name, totalWeight: result.data.totalWeight, ingredients: ingredients.value },
    'confirm',
  )
}

function cancel() {
  modalController.dismiss(null, 'cancel')
}
</script>

<template>
  <IonHeader>
    <IonToolbar>
      <IonTitle>Новый рецепт</IonTitle>
      <IonButtons slot="start">
        <IonButton @click="cancel">Отмена</IonButton>
      </IonButtons>
      <IonButtons slot="end">
        <IonButton strong @click="submit">Сохранить</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent class="ion-padding">
    <p v-for="err in errors" :key="err" class="error">{{ err }}</p>

    <IonList>
      <IonItem>
        <IonInput v-model="name" label="Название рецепта" label-placement="stacked" placeholder="Плов" />
      </IonItem>
      <IonItem>
        <IonInput
          v-model="totalWeight"
          type="number"
          label="Итоговый вес готового блюда, г"
          label-placement="stacked"
        />
      </IonItem>
    </IonList>

    <h3>Ингредиенты</h3>
    <IonList>
      <IonItem v-for="(ingredient, index) in ingredients" :key="index">
        <IonLabel>
          {{ ingredient.food.name }} — {{ ingredient.amount }}
          {{ ingredient.unit === 'g' ? 'г' : ingredient.unit === 'ml' ? 'мл' : 'шт' }}
        </IonLabel>
        <IonButton fill="clear" color="danger" slot="end" @click="removeIngredient(index)">Убрать</IonButton>
      </IonItem>
      <IonItem v-if="!ingredients.length">
        <IonLabel color="medium">Ингредиенты не добавлены</IonLabel>
      </IonItem>
    </IonList>

    <div v-if="totalWeight && ingredients.length" class="preview">
      На 100 г: {{ previewPer100g().kcal }} ккал, Б {{ previewPer100g().protein }} / Ж {{ previewPer100g().fat }} / У
      {{ previewPer100g().carbs }}
    </div>

    <h3>Добавить ингредиент</h3>
    <IonSearchbar v-model="searchQuery" placeholder="Поиск продукта" />
    <IonList>
      <IonItem v-for="food in searchResults" :key="food.id">
        <IonLabel>{{ food.name }}</IonLabel>
        <IonInput
          :model-value="draftAmount[food.id] ?? 100"
          type="number"
          style="max-width: 80px"
          @ion-input="(e) => (draftAmount[food.id] = Number(e.detail.value))"
        />
        <IonSelect :model-value="draftUnit[food.id] ?? food.defaultUnit" @ion-change="(e) => (draftUnit[food.id] = e.detail.value)">
          <IonSelectOption value="g">г</IonSelectOption>
          <IonSelectOption value="ml">мл</IonSelectOption>
          <IonSelectOption value="pcs">шт</IonSelectOption>
          <IonSelectOption value="portion">порция</IonSelectOption>
        </IonSelect>
        <IonButton slot="end" fill="clear" @click="addIngredient(food)">Добавить</IonButton>
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}

.preview {
  padding: 12px;
  margin: 12px 0;
  border-radius: 8px;
  background: var(--ion-color-light);
}
</style>
