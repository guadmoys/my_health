<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  alertController,
  modalController,
} from '@ionic/vue'
import {
  helpCircleOutline,
  openOutline,
  pencilOutline,
  thumbsDown,
  thumbsUp,
  trashOutline,
} from 'ionicons/icons'
import { ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { medicineRepository } from '@/database/repositories'
import type { Medicine } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import MedicineFormModal from './components/MedicineFormModal.vue'
import type { MedicineFormOutput } from './schemas'

const toast = useToast()
const searchQuery = ref('')

const medicines = useLiveQuery(() => medicineRepository.search(searchQuery.value), [] as Medicine[], [searchQuery])

const effectIcon = { helped: thumbsUp, not_helped: thumbsDown, unknown: helpCircleOutline }
const effectColor = { helped: 'success', not_helped: 'danger', unknown: 'medium' }
const effectLabel = { helped: 'Помогло', not_helped: 'Не помогло', unknown: 'Не знаю' }

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
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Аптечка</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="ion-padding-horizontal ion-padding-top">
        <IonSearchbar v-model="searchQuery" placeholder="Поиск по названию или симптому" />
      </div>

      <IonList>
        <IonItemSliding v-for="medicine in medicines" :key="medicine.id">
          <IonItem>
            <IonIcon :icon="effectIcon[medicine.effect]" :color="effectColor[medicine.effect]" slot="start" :aria-label="effectLabel[medicine.effect]" />
            <IonLabel>
              <h2>{{ medicine.name }}</h2>
              <p>{{ medicine.category }}</p>
              <p v-if="medicine.comment">{{ medicine.comment }}</p>
            </IonLabel>
            <IonButton v-if="medicine.link" fill="clear" slot="end" :href="medicine.link" target="_blank" rel="noopener">
              <IonIcon :icon="openOutline" slot="icon-only" aria-label="Открыть товар" />
            </IonButton>
          </IonItem>
          <IonItemOptions side="end">
            <IonItemOption color="primary" @click="openEditForm(medicine)">
              <IonIcon :icon="pencilOutline" slot="icon-only" />
            </IonItemOption>
            <IonItemOption color="danger" @click="confirmDelete(medicine)">
              <IonIcon :icon="trashOutline" slot="icon-only" />
            </IonItemOption>
          </IonItemOptions>
        </IonItemSliding>

        <IonItem v-if="!medicines.length">
          <IonNote>Ничего не найдено. Добавьте лекарство кнопкой ниже.</IonNote>
        </IonItem>
      </IonList>

      <div class="ion-padding">
        <IonButton expand="block" @click="openCreateForm">+ Добавить лекарство</IonButton>
      </div>
    </IonContent>
  </IonPage>
</template>
