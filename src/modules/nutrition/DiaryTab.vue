<script setup lang="ts">
import { IonButton, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, modalController } from '@ionic/vue'
import dayjs from 'dayjs'
import { chevronBackOutline, chevronForwardOutline, trashOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { mealRepository, profileRepository } from '@/database/repositories'
import type { Meal, MealItem, MealType } from '@/database/types'
import { DATE_FORMAT, today } from '@/utils/date'

import AddMealItemModal from './components/AddMealItemModal.vue'

const toast = useToast()
const date = ref(today())

const isToday = computed(() => date.value === today())
function shiftDay(delta: number) {
  date.value = dayjs(date.value).add(delta, 'day').format(DATE_FORMAT)
}

const nutritionMode = useLiveQuery(
  async () => (await profileRepository.getCurrent())?.nutritionDisplayMode ?? 'full',
  'full' as const,
)

const meals = useLiveQuery(() => mealRepository.getByDate(date.value), [] as Meal[], [date])
const items = useLiveQuery(() => mealRepository.getItemsForDate(date.value), [] as MealItem[], [date])

const slots: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Завтрак' },
  { type: 'lunch', label: 'Обед' },
  { type: 'dinner', label: 'Ужин' },
  { type: 'snack', label: 'Перекус' },
]

function itemsFor(type: MealType) {
  const mealIds = new Set(meals.value.filter((m) => m.type === type).map((m) => m.id))
  return items.value.filter((i) => mealIds.has(i.mealId))
}

async function openAdd(type: MealType) {
  const modal = await modalController.create({
    component: AddMealItemModal,
    componentProps: { date: date.value, mealType: type },
  })
  await modal.present()
  const { role } = await modal.onWillDismiss()
  if (role === 'confirm') await toast.success('Добавлено в дневник')
}

async function removeItem(item: MealItem) {
  await mealRepository.deleteItem(item.id)
}

const dayTotals = computed(() =>
  items.value.reduce(
    (acc, item) => {
      acc.kcal += item.nutritionSnapshot.kcal ?? 0
      acc.protein += item.nutritionSnapshot.protein ?? 0
      acc.fat += item.nutritionSnapshot.fat ?? 0
      acc.carbs += item.nutritionSnapshot.carbs ?? 0
      return acc
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  ),
)
</script>

<template>
  <div class="date-nav ion-padding-horizontal ion-padding-top">
    <IonButton fill="clear" @click="shiftDay(-1)">
      <IonIcon :icon="chevronBackOutline" slot="icon-only" />
    </IonButton>
    <strong>{{ isToday ? 'Сегодня' : date }}</strong>
    <IonButton fill="clear" :disabled="isToday" @click="shiftDay(1)">
      <IonIcon :icon="chevronForwardOutline" slot="icon-only" />
    </IonButton>
  </div>

  <div v-if="nutritionMode === 'full'" class="ion-padding-horizontal totals">
    Итого: {{ Math.round(dayTotals.kcal) }} ккал · Б {{ Math.round(dayTotals.protein) }} · Ж
    {{ Math.round(dayTotals.fat) }} · У {{ Math.round(dayTotals.carbs) }}
  </div>

  <IonList v-for="slot in slots" :key="slot.type">
    <IonListHeader>{{ slot.label }}</IonListHeader>
    <IonItemSliding v-for="item in itemsFor(slot.type)" :key="item.id">
      <IonItem>
        <IonLabel>
          <h3>{{ item.nameSnapshot }}</h3>
          <p v-if="nutritionMode !== 'hidden'">
            {{ item.amount }}{{ item.unit === 'g' ? 'г' : item.unit === 'ml' ? 'мл' : 'шт' }}
            <template v-if="nutritionMode === 'full'"> · {{ item.nutritionSnapshot.kcal ?? '—' }} ккал</template>
          </p>
        </IonLabel>
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="danger" @click="removeItem(item)">
          <IonIcon :icon="trashOutline" slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
    <IonItem v-if="!itemsFor(slot.type).length" lines="none">
      <IonLabel color="medium">Ничего не записано</IonLabel>
    </IonItem>
    <IonItem button lines="none" @click="openAdd(slot.type)">
      <IonLabel color="primary">+ Добавить</IonLabel>
    </IonItem>
  </IonList>
</template>

<style scoped>
.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.totals {
  color: var(--ion-color-medium);
  margin-bottom: 8px;
}
</style>
