<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, actionSheetController, alertController, modalController } from '@ionic/vue'
import { barbellOutline, ellipsisHorizontal } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import { Badge, EmptyState, EntityCard, FabButton } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { workoutRepository, workoutSessionRepository } from '@/database/repositories'
import type { Workout } from '@/database/types'
import { stringHue } from '@/utils/color'
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

async function openActions(workout: Workout) {
  const sheet = await actionSheetController.create({
    header: workout.name,
    buttons: [
      { text: 'Дублировать', handler: () => duplicate(workout) },
      { text: 'В архив', role: 'destructive', handler: () => confirmArchive(workout) },
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
        <IonTitle>Тренировки</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="wrap">
        <div v-if="activeSession" class="resume-banner">
          <IonButton expand="block" color="warning" :router-link="`/workouts/session/${activeSession.id}`">
            Продолжить тренировку
          </IonButton>
        </div>

        <div v-if="workouts.length" class="grid">
          <EntityCard
            v-for="workout in workouts"
            :key="workout.id"
            :avatar-icon="barbellOutline"
            :avatar-hue="stringHue(workout.category)"
            :clickable="false"
          >
            <template #title>
              <router-link :to="`/workouts/${workout.id}`" class="stretched-link">{{ workout.name }}</router-link>
            </template>
            <template #subtitle>{{ workout.category }}</template>
            <template #trailing>
              <button type="button" class="icon-btn" aria-label="Действия" @click="openActions(workout)">
                <IonIcon :icon="ellipsisHorizontal" aria-hidden="true" />
              </button>
            </template>
            <template v-if="workout.estimatedMinutes" #footer>
              <Badge tone="accent">{{ workout.estimatedMinutes }} мин</Badge>
            </template>
          </EntityCard>
        </div>

        <EmptyState v-else :icon="barbellOutline" title="Тренировок пока нет" note="Создайте первую кнопкой ниже." />
      </div>

      <FabButton @click="openCreateForm">Тренировка</FabButton>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 16px 96px;
}

.resume-banner {
  margin-bottom: 12px;
}

.grid {
  display: grid;
  gap: 10px;
}

.stretched-link {
  color: inherit;
  text-decoration: none;
}

.stretched-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.icon-btn {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  padding: 4px;
  cursor: pointer;
  display: flex;
}
</style>
