<script setup lang="ts">
import { IonIcon, IonSearchbar, alertController, modalController } from '@ionic/vue'
import { fastFoodOutline, pencilOutline, star as starFilled, starOutline, trashOutline } from 'ionicons/icons'
import { ref } from 'vue'

import { Badge, EmptyState, EntityCard, FabButton } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { foodRepository } from '@/database/repositories'
import type { Food } from '@/database/types'
import { stringHue } from '@/utils/color'
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
  const { data, role } = await modal.onDidDismiss<FoodFormInput>()
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
  const { data, role } = await modal.onDidDismiss<FoodFormInput>()
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
  <div class="wrap">
    <IonSearchbar v-model="searchQuery" placeholder="Поиск продукта" class="wrap__search" />

    <div v-if="foods.length" class="grid">
      <EntityCard
        v-for="food in foods"
        :key="food.id"
        :avatar-text="food.category.charAt(0).toUpperCase()"
        :avatar-hue="stringHue(food.category)"
        :clickable="false"
      >
        <template #title>{{ food.name }}</template>
        <template #subtitle>{{ food.category }}</template>
        <template #trailing>
          <button type="button" class="icon-btn" :aria-label="food.favorite ? 'Убрать из избранного' : 'В избранное'" @click="toggleFavorite(food)">
            <IonIcon :icon="food.favorite ? starFilled : starOutline" :class="{ 'icon-btn--active': food.favorite }" aria-hidden="true" />
          </button>
          <button type="button" class="icon-btn" aria-label="Изменить" @click="openEditForm(food)">
            <IonIcon :icon="pencilOutline" aria-hidden="true" />
          </button>
          <button type="button" class="icon-btn" aria-label="Удалить" @click="confirmDelete(food)">
            <IonIcon :icon="trashOutline" aria-hidden="true" />
          </button>
        </template>
        <template v-if="food.kcalPer100 !== undefined" #footer>
          <Badge tone="accent">{{ food.kcalPer100 }} ккал / 100{{ food.defaultUnit === 'ml' ? 'мл' : 'г' }}</Badge>
        </template>
      </EntityCard>
    </div>

    <EmptyState v-else :icon="fastFoodOutline" title="Ничего не найдено" note="Добавьте новый продукт кнопкой ниже." />

    <FabButton @click="openCreateForm">Продукт</FabButton>
  </div>
</template>

<style scoped>
.wrap {
  padding: 12px 16px 96px;
}

.wrap__search {
  padding: 0 0 8px;
}

.grid {
  display: grid;
  gap: 10px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: inherit;
  padding: 4px;
  cursor: pointer;
  display: flex;
}

.icon-btn ion-icon {
  font-size: 1.1rem;
  opacity: 0.5;
}

.icon-btn ion-icon.icon-btn--active {
  color: var(--ion-color-warning);
  opacity: 1;
}
</style>
