<script setup lang="ts">
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonTitle, IonToolbar, actionSheetController, alertController, modalController } from '@ionic/vue'
import { helpCircleOutline, linkOutline, medkitOutline, thumbsDown, thumbsUp } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { Badge, EmptyState, EntityCard, FabButton, StatBar } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { medicineRepository } from '@/database/repositories'
import type { Medicine } from '@/database/types'
import { stringHue } from '@/utils/color'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import MedicineFormModal from './components/MedicineFormModal.vue'
import type { MedicineFormOutput } from './schemas'

const toast = useToast()
const searchQuery = ref('')

const medicines = useLiveQuery(() => medicineRepository.search(searchQuery.value), [] as Medicine[], [searchQuery])

const stats = computed(() => [
  { value: medicines.value.length, label: 'всего' },
  { value: medicines.value.filter((m) => m.effect === 'helped').length, label: 'помогло', tone: 'good' as const },
  { value: medicines.value.filter((m) => m.effect === 'not_helped').length, label: 'не помогло', tone: 'bad' as const },
])

const effectMeta = {
  helped: { icon: thumbsUp, label: 'Помогло', tone: 'good' },
  not_helped: { icon: thumbsDown, label: 'Не помогло', tone: 'bad' },
  unknown: { icon: helpCircleOutline, label: 'Не знаю', tone: 'neutral' },
} as const

async function openCreateForm() {
  const modal = await modalController.create({ component: MedicineFormModal })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<MedicineFormOutput>()
  if (role !== 'confirm' || !data) return

  await medicineRepository.add({
    id: createId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...data,
  })
  await toast.success('Лекарство добавлено')
}

async function openEditForm(medicine: Medicine) {
  const modal = await modalController.create({ component: MedicineFormModal, componentProps: { medicine } })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<MedicineFormOutput>()
  if (role !== 'confirm' || !data) return

  await medicineRepository.update(medicine.id, { ...data, updatedAt: nowIso() })
  await toast.success('Лекарство обновлено')
}

async function confirmDelete(medicine: Medicine) {
  const alert = await alertController.create({
    header: 'Удалить лекарство?',
    message: `«${medicine.name}» будет удалено из списка.`,
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      {
        text: 'Удалить',
        role: 'destructive',
        handler: () => {
          void medicineRepository.delete(medicine.id)
        },
      },
    ],
  })
  await alert.present()
}

async function openActions(medicine: Medicine) {
  const sheet = await actionSheetController.create({
    header: medicine.name,
    buttons: [
      ...(medicine.link
        ? [{ text: 'Открыть товар', handler: () => void window.open(medicine.link, '_blank', 'noopener') }]
        : []),
      { text: 'Изменить', handler: () => openEditForm(medicine) },
      { text: 'Удалить', role: 'destructive', handler: () => confirmDelete(medicine) },
      { text: 'Отмена', role: 'cancel' },
    ],
  })
  await sheet.present()
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Аптечка</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="wrap">
        <StatBar :stats="stats" class="wrap__stats" />

        <IonSearchbar v-model="searchQuery" placeholder="Поиск по названию или симптому" class="wrap__search" />

        <div v-if="medicines.length" class="grid">
          <EntityCard
            v-for="medicine in medicines"
            :key="medicine.id"
            :avatar-text="medicine.category.charAt(0).toUpperCase()"
            :avatar-hue="stringHue(medicine.category)"
            :accent="effectMeta[medicine.effect].tone"
            @click="openActions(medicine)"
          >
            <template #title>{{ medicine.name }}</template>
            <template #subtitle>{{ medicine.category }}</template>
            <template #trailing>
              <IonIcon v-if="medicine.link" :icon="linkOutline" class="link-hint" aria-hidden="true" />
            </template>
            <template v-if="medicine.comment" #description>{{ medicine.comment }}</template>
            <template #footer>
              <Badge :tone="effectMeta[medicine.effect].tone" :icon="effectMeta[medicine.effect].icon">
                {{ effectMeta[medicine.effect].label }}
              </Badge>
            </template>
          </EntityCard>
        </div>

        <EmptyState
          v-else
          :icon="medkitOutline"
          title="Пока пусто"
          note="Добавьте первое лекарство — что помогло, а что нет, всегда будет под рукой."
        />
      </div>

      <FabButton @click="openCreateForm">Добавить</FabButton>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 16px 96px;
}

.wrap__stats {
  margin-bottom: 12px;
}

.wrap__search {
  padding: 0 0 8px;
}

.grid {
  display: grid;
  gap: 10px;
}

.link-hint {
  opacity: 0.5;
}
</style>
