<script setup lang="ts">
import {
  IonButton,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  alertController,
  modalController,
} from '@ionic/vue'
import { pencilOutline, starOutline, star as starFilled, trashOutline } from 'ionicons/icons'
import { ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { foodRepository } from '@/database/repositories'
import type { Food } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import FoodFormModal from './components/FoodFormModal.vue'
import type { FoodFormInput } from './schemas'

const toast = useToast()
const searchQuery = ref('')

const foods = useLiveQuery(() => foodRepository.search(searchQuery.value), [] as Food[], [searchQuery])

async function toggleFavorite(food: Food) {
  await foodRepository.update(food.id, { favorite: !food.favorite })
}

async function openCreateForm() {
  const modal = await modalController.create({ component: FoodFormModal })
  await modal.present()
  const { data, role } = await modal.onWillDismiss<FoodFormInput>()
  if (role !== 'confirm' || !data) return

  await foodRepository.add({
    id: createId(),
    favorite: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...data,
  })
  await toast.success('Продукт добавлен')
}

async function openEditForm(food: Food) {
  const modal = await modalController.create({ component: FoodFormModal, componentProps: { food } })
  await modal.present()
  const { data, role } = await modal.onWillDismiss<FoodFormInput>()
  if (role !== 'confirm' || !data) return

  await foodRepository.update(food.id, { ...data, updatedAt: nowIso() })
  await toast.success('Продукт обновлён')
}

async function confirmDelete(food: Food) {
  const alert = await alertController.create({
    header: 'Удалить продукт?',
    message: `«${food.name}» будет удалён из справочника. История приёмов пищи не изменится.`,
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      {
        text: 'Удалить',
        role: 'destructive',
        handler: () => {
          void foodRepository.delete(food.id)
        },
      },
    ],
  })
  await alert.present()
}
</script>

<template>
  <div class="ion-padding-horizontal ion-padding-top">
    <IonSearchbar v-model="searchQuery" placeholder="Поиск продукта" />
  </div>

  <IonList>
    <IonItemSliding v-for="food in foods" :key="food.id">
      <IonItem>
        <IonLabel>
          <h2>{{ food.name }}</h2>
          <p>{{ food.category }} · {{ food.kcalPer100 ?? '—' }} ккал/100{{ food.defaultUnit === 'ml' ? 'мл' : 'г' }}</p>
        </IonLabel>
        <IonButton fill="clear" slot="end" @click="toggleFavorite(food)">
          <IonIcon :icon="food.favorite ? starFilled : starOutline" slot="icon-only" aria-label="Избранное" />
        </IonButton>
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="primary" @click="openEditForm(food)">
          <IonIcon :icon="pencilOutline" slot="icon-only" />
        </IonItemOption>
        <IonItemOption color="danger" @click="confirmDelete(food)">
          <IonIcon :icon="trashOutline" slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>

    <IonItem v-if="!foods.length">
      <IonNote>Ничего не найдено. Добавьте новый продукт кнопкой ниже.</IonNote>
    </IonItem>
  </IonList>

  <div class="ion-padding">
    <IonButton expand="block" @click="openCreateForm">+ Новый продукт</IonButton>
  </div>
</template>
