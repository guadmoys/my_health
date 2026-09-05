<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonReorder,
  IonReorderGroup,
  IonTitle,
  IonToolbar,
  alertController,
  modalController,
} from '@ionic/vue'
import { pencilOutline, trashOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { exerciseRepository, workoutRepository, workoutSessionRepository } from '@/database/repositories'
import type { Exercise, Workout, WorkoutExercise, WorkoutSession } from '@/database/types'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'

import ExercisePickerModal from './components/ExercisePickerModal.vue'
import WorkoutExerciseFormModal from './components/WorkoutExerciseFormModal.vue'
import WorkoutFormModal from './components/WorkoutFormModal.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const toast = useToast()

const workout = useLiveQuery(() => workoutRepository.get(props.id), undefined, [() => props.id])
const workoutExercises = useLiveQuery(
  () => workoutRepository.getExercises(props.id),
  [] as WorkoutExercise[],
  [() => props.id],
)
const history = useLiveQuery(
  () => workoutSessionRepository.getHistoryForWorkout(props.id),
  [] as WorkoutSession[],
  [() => props.id],
)

const exercisesById = ref<Record<string, Exercise>>({})
watch(
  workoutExercises,
  async (list) => {
    const missing = [...new Set(list.map((e) => e.exerciseId))].filter((id) => !exercisesById.value[id])
    if (!missing.length) return
    for (const exercise of await exerciseRepository.getMany(missing)) {
      exercisesById.value[exercise.id] = exercise
    }
  },
  { immediate: true },
)

interface ExerciseConfig {
  exerciseId: string
  sets: number
  repsMin?: number
  repsMax?: number
  durationSeconds?: number
  distance?: number
  restSeconds: number
  targetWeight?: number
}

async function addExercise() {
  const pickModal = await modalController.create({ component: ExercisePickerModal })
  await pickModal.present()
  const { data: exercise, role: pickRole } = await pickModal.onDidDismiss<Exercise>()
  if (pickRole !== 'confirm' || !exercise) return

  const configModal = await modalController.create({
    component: WorkoutExerciseFormModal,
    componentProps: { exercise },
  })
  await configModal.present()
  const { data: config, role: configRole } = await configModal.onDidDismiss<ExerciseConfig>()
  if (configRole !== 'confirm' || !config) return

  const entry: WorkoutExercise = {
    id: createId(),
    workoutId: props.id,
    position: workoutExercises.value.length,
    ...config,
  }
  await workoutRepository.updateExercises(props.id, [...workoutExercises.value, entry])
}

async function editExercise(entry: WorkoutExercise) {
  const exercise = exercisesById.value[entry.exerciseId]
  if (!exercise) return

  const modal = await modalController.create({
    component: WorkoutExerciseFormModal,
    componentProps: { exercise, existing: entry },
  })
  await modal.present()
  const { data: config, role } = await modal.onDidDismiss<ExerciseConfig>()
  if (role !== 'confirm' || !config) return

  const updated = workoutExercises.value.map((e) => (e.id === entry.id ? { ...e, ...config } : e))
  await workoutRepository.updateExercises(props.id, updated)
}

async function removeExercise(entry: WorkoutExercise) {
  const remaining = workoutExercises.value
    .filter((e) => e.id !== entry.id)
    .map((e, index) => ({ ...e, position: index }))
  await workoutRepository.updateExercises(props.id, remaining)
}

function handleReorder(event: CustomEvent) {
  const reordered = (event.target as unknown as { complete: (data: WorkoutExercise[]) => WorkoutExercise[] }).complete(
    [...workoutExercises.value],
  )
  void workoutRepository.updateExercises(
    props.id,
    reordered.map((e, index) => ({ ...e, position: index })),
  )
}

async function editMeta() {
  if (!workout.value) return
  const modal = await modalController.create({ component: WorkoutFormModal, componentProps: { workout: workout.value } })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<Partial<Workout>>()
  if (role !== 'confirm' || !data) return
  await workoutRepository.updateMeta(props.id, data)
}

async function startWorkout() {
  if (!workout.value) return

  const active = await workoutSessionRepository.getActive()
  if (active && active.workoutId !== props.id) {
    const alert = await alertController.create({
      header: 'Есть незавершённая тренировка',
      message: 'Сначала завершите или отмените текущую тренировку.',
      buttons: [
        { text: 'Ок', role: 'cancel' },
        { text: 'Перейти к ней', handler: () => router.push(`/workouts/session/${active.id}`) },
      ],
    })
    await alert.present()
    return
  }
  if (active && active.workoutId === props.id) {
    router.push(`/workouts/session/${active.id}`)
    return
  }
  if (!workoutExercises.value.length) {
    await toast.error('Добавьте хотя бы одно упражнение')
    return
  }

  const session = await workoutSessionRepository.start(workout.value, workoutExercises.value, today())
  router.push(`/workouts/session/${session.id}`)
}

function exerciseSummary(entry: WorkoutExercise, exercise?: Exercise) {
  if (!exercise) return ''
  if (exercise.type === 'time') return `${entry.sets} × ${entry.durationSeconds ?? '—'} сек`
  if (exercise.type === 'distance') return `${entry.sets} × ${entry.distance ?? '—'} м`
  const reps = entry.repsMin && entry.repsMax ? `${entry.repsMin}-${entry.repsMax}` : entry.repsMin ?? entry.repsMax ?? '—'
  return `${entry.sets} × ${reps}${entry.targetWeight ? ` · ${entry.targetWeight} кг` : ''}`
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ workout?.name ?? 'Тренировка' }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div v-if="workout" class="ion-padding-horizontal ion-padding-top">
        <p v-if="workout.description">{{ workout.description }}</p>
        <IonButton fill="clear" size="small" @click="editMeta">
          <IonIcon :icon="pencilOutline" slot="start" />
          Изменить
        </IonButton>
      </div>

      <IonListHeader>Упражнения</IonListHeader>
      <IonList>
        <IonReorderGroup :disabled="false" @ion-item-reorder="handleReorder">
          <IonItem v-for="entry in workoutExercises" :key="entry.id" button @click="editExercise(entry)">
            <IonLabel>
              <h2>{{ exercisesById[entry.exerciseId]?.name ?? '…' }}</h2>
              <p>{{ exerciseSummary(entry, exercisesById[entry.exerciseId]) }} · отдых {{ entry.restSeconds }} с</p>
            </IonLabel>
            <IonButton fill="clear" color="danger" slot="end" @click.stop="removeExercise(entry)">
              <IonIcon :icon="trashOutline" slot="icon-only" />
            </IonButton>
            <IonReorder slot="end" />
          </IonItem>
        </IonReorderGroup>
        <IonItem v-if="!workoutExercises.length">
          <IonLabel color="medium">Упражнения не добавлены</IonLabel>
        </IonItem>
      </IonList>

      <div class="ion-padding">
        <IonButton expand="block" fill="outline" @click="addExercise">+ Добавить упражнение</IonButton>
        <IonButton expand="block" style="margin-top: 12px" @click="startWorkout">Начать тренировку</IonButton>
      </div>

      <template v-if="history.length">
        <IonListHeader>История</IonListHeader>
        <IonList>
          <IonItem v-for="session in history" :key="session.id">
            <IonLabel>
              <h3>{{ session.date }}</h3>
              <p>
                Объём: {{ Math.round(session.totalVolume ?? 0) }} кг ·
                {{ Math.round((session.totalDurationSeconds ?? 0) / 60) }} мин
              </p>
            </IonLabel>
          </IonItem>
        </IonList>
      </template>
    </IonContent>
  </IonPage>
</template>
