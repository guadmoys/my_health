<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  alertController,
  modalController,
} from '@ionic/vue'
import { useRouter } from 'vue-router'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { workoutRepository, workoutSessionRepository } from '@/database/repositories'
import type { Workout } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import WorkoutFormModal from './components/WorkoutFormModal.vue'

const router = useRouter()
const toast = useToast()

const workouts = useLiveQuery(() => workoutRepository.getAll(), [] as Workout[])
const activeSession = useLiveQuery(() => workoutSessionRepository.getActive(), undefined)

async function openCreateForm() {
  const modal = await modalController.create({ component: WorkoutFormModal })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<{
    name: string
    category: string
    description?: string
    estimatedMinutes?: number
  }>()
  if (role !== 'confirm' || !data) return

  const workout: Workout = {
    id: createId(),
    ...data,
    archived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  await workoutRepository.createWithExercises(workout, [])
  router.push(`/workouts/${workout.id}`)
}

async function duplicate(workout: Workout) {
  await workoutRepository.duplicate(workout.id, `${workout.name} (копия)`)
  await toast.success('Тренировка скопирована')
}

async function confirmArchive(workout: Workout) {
  const alert = await alertController.create({
    header: 'Архивировать тренировку?',
    message: `«${workout.name}» будет скрыта из списка. История тренировок сохранится.`,
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      { text: 'Архивировать', role: 'destructive', handler: () => void workoutRepository.archive(workout.id) },
    ],
  })
  await alert.present()
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Тренировки</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div v-if="activeSession" class="ion-padding resume-banner">
        <IonButton expand="block" color="warning" :router-link="`/workouts/session/${activeSession.id}`">
          Продолжить тренировку
        </IonButton>
      </div>

      <IonList>
        <IonItemSliding v-for="workout in workouts" :key="workout.id">
          <IonItem :router-link="`/workouts/${workout.id}`" button>
            <IonLabel>
              <h2>{{ workout.name }}</h2>
              <p>{{ workout.category }}<template v-if="workout.estimatedMinutes"> · {{ workout.estimatedMinutes }} мин</template></p>
            </IonLabel>
          </IonItem>
          <IonItemOptions side="end">
            <IonItemOption color="primary" @click="duplicate(workout)">Копия</IonItemOption>
            <IonItemOption color="medium" @click="confirmArchive(workout)">Архив</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>

        <IonItem v-if="!workouts.length">
          <IonLabel color="medium">Тренировок пока нет. Создайте первую кнопкой ниже.</IonLabel>
        </IonItem>
      </IonList>

      <div class="ion-padding">
        <IonButton expand="block" @click="openCreateForm">+ Создать тренировку</IonButton>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.resume-banner {
  padding-bottom: 0;
}
</style>
