<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { star as starFilled, timeOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  computeNutritionSnapshot,
  foodRepository,
  mealRepository,
  recipeRepository,
  scalePer100g,
} from '@/database/repositories'
import type { Food, MealType, PortionUnit, Recipe } from '@/database/types'
import { createId } from '@/utils/id'

const props = defineProps<{ date: string; mealType: MealType }>()

const source = ref<'food' | 'recipe'>('food')
const searchQuery = ref('')

// --- Foods ---
const searchResults = useLiveQuery(() => foodRepository.search(searchQuery.value), [] as Food[], [searchQuery])
const recentFoods = useLiveQuery(() => foodRepository.getRecent(8), [] as Food[])
const favoriteFoods = useLiveQuery(() => foodRepository.getFavorites(), [] as Food[])

const selectedFood = ref<Food>()
// IonInput always emits a string via v-model, even for type="number".
const foodAmount = ref<string | number>(100)
const foodUnit = ref<PortionUnit>('g')
const foodAmountNumber = () => Number(foodAmount.value) || 0

function pickFood(food: Food) {
  selectedFood.value = food
  foodAmount.value = food.defaultPortion ?? 100
  foodUnit.value = food.defaultUnit
}

const foodPreview = computed(() =>
  selectedFood.value ? computeNutritionSnapshot(selectedFood.value, foodAmountNumber(), foodUnit.value) : undefined,
)

async function confirmFood() {
  if (!selectedFood.value) return
  await mealRepository.addItemToSlot(props.date, props.mealType, {
    id: createId(),
    foodId: selectedFood.value.id,
    nameSnapshot: selectedFood.value.name,
    amount: foodAmountNumber(),
    unit: foodUnit.value,
    nutritionSnapshot: computeNutritionSnapshot(selectedFood.value, foodAmountNumber(), foodUnit.value),
  })
  modalController.dismiss(null, 'confirm')
}

// --- Recipes ---
const recipes = useLiveQuery(() => recipeRepository.getAll(), [] as Recipe[])
const selectedRecipe = ref<Recipe>()
const recipePortionGrams = ref<string | number>(200)
const recipePortionGramsNumber = () => Number(recipePortionGrams.value) || 0
const recipePer100g = ref<Awaited<ReturnType<typeof recipeRepository.getNutritionPer100g>>>()

async function pickRecipe(recipe: Recipe) {
  selectedRecipe.value = recipe
  recipePortionGrams.value = Math.round(recipe.totalWeight / 2) || 200
  recipePer100g.value = await recipeRepository.getNutritionPer100g(recipe)
}

const recipePreview = computed(() =>
  recipePer100g.value ? scalePer100g(recipePer100g.value, recipePortionGramsNumber()) : undefined,
)

async function confirmRecipe() {
  if (!selectedRecipe.value || !recipePer100g.value) return
  await mealRepository.addItemToSlot(props.date, props.mealType, {
    id: createId(),
    recipeId: selectedRecipe.value.id,
    nameSnapshot: selectedRecipe.value.name,
    amount: recipePortionGramsNumber(),
    unit: 'g',
    nutritionSnapshot: scalePer100g(recipePer100g.value, recipePortionGramsNumber()),
  })
  modalController.dismiss(null, 'confirm')
}

function cancel() {
  modalController.dismiss(null, 'cancel')
}
</script>

<template>
  <IonHeader>
    <IonToolbar>
      <IonTitle>Добавить в приём пищи</IonTitle>
      <IonButtons slot="start">
        <IonButton @click="cancel">Отмена</IonButton>
      </IonButtons>
    </IonToolbar>
    <IonToolbar>
      <IonSegment v-model="source">
        <IonSegmentButton value="food">Продукты</IonSegmentButton>
        <IonSegmentButton value="recipe">Рецепты</IonSegmentButton>
      </IonSegment>
    </IonToolbar>
  </IonHeader>

  <IonContent class="ion-padding">
    <template v-if="source === 'food'">
      <template v-if="!selectedFood">
        <IonSearchbar v-model="searchQuery" placeholder="Поиск продукта" />

        <template v-if="!searchQuery">
          <IonList v-if="favoriteFoods.length">
            <IonListHeader><IonIcon :icon="starFilled" /> &nbsp;Избранное</IonListHeader>
            <IonItem v-for="food in favoriteFoods" :key="food.id" button @click="pickFood(food)">
              <IonLabel>{{ food.name }}</IonLabel>
            </IonItem>
          </IonList>
          <IonList v-if="recentFoods.length">
            <IonListHeader><IonIcon :icon="timeOutline" /> &nbsp;Недавние</IonListHeader>
            <IonItem v-for="food in recentFoods" :key="food.id" button @click="pickFood(food)">
              <IonLabel>{{ food.name }}</IonLabel>
            </IonItem>
          </IonList>
        </template>
        <IonList v-else>
          <IonItem v-for="food in searchResults" :key="food.id" button @click="pickFood(food)">
            <IonLabel>{{ food.name }}</IonLabel>
          </IonItem>
          <IonItem v-if="!searchResults.length">
            <IonLabel color="medium">Ничего не найдено</IonLabel>
          </IonItem>
        </IonList>
      </template>

      <template v-else>
        <IonList>
          <IonItem>
            <IonLabel>{{ selectedFood.name }}</IonLabel>
            <IonButton fill="clear" slot="end" @click="selectedFood = undefined">Изменить</IonButton>
          </IonItem>
          <IonItem>
            <IonInput v-model="foodAmount" type="number" label="Количество" label-placement="stacked" />
          </IonItem>
          <IonItem>
            <IonSelect v-model="foodUnit" label="Единица" label-placement="stacked">
              <IonSelectOption value="g">г</IonSelectOption>
              <IonSelectOption value="ml">мл</IonSelectOption>
              <IonSelectOption value="pcs">шт</IonSelectOption>
              <IonSelectOption value="portion">порция</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>
        <div v-if="foodPreview" class="preview">
          {{ foodPreview.kcal ?? '—' }} ккал, Б {{ foodPreview.protein ?? '—' }} / Ж {{ foodPreview.fat ?? '—' }} / У
          {{ foodPreview.carbs ?? '—' }}
        </div>
        <IonButton expand="block" @click="confirmFood">Добавить</IonButton>
      </template>
    </template>

    <template v-else>
      <template v-if="!selectedRecipe">
        <IonList>
          <IonItem v-for="recipe in recipes" :key="recipe.id" button @click="pickRecipe(recipe)">
            <IonLabel>{{ recipe.name }}</IonLabel>
          </IonItem>
          <IonItem v-if="!recipes.length">
            <IonLabel color="medium">Рецептов пока нет</IonLabel>
          </IonItem>
        </IonList>
      </template>
      <template v-else>
        <IonList>
          <IonItem>
            <IonLabel>{{ selectedRecipe.name }}</IonLabel>
            <IonButton fill="clear" slot="end" @click="selectedRecipe = undefined">Изменить</IonButton>
          </IonItem>
          <IonItem>
            <IonInput v-model="recipePortionGrams" type="number" label="Порция, г" label-placement="stacked" />
          </IonItem>
        </IonList>
        <div v-if="recipePreview" class="preview">
          {{ recipePreview.kcal ?? '—' }} ккал, Б {{ recipePreview.protein ?? '—' }} / Ж {{ recipePreview.fat ?? '—' }} / У
          {{ recipePreview.carbs ?? '—' }}
        </div>
        <IonButton expand="block" @click="confirmRecipe">Добавить</IonButton>
      </template>
    </template>
  </IonContent>
</template>

<style scoped>
.preview {
  padding: 12px;
  margin: 12px 0;
  border-radius: 8px;
  background: var(--ion-color-light);
}
</style>
