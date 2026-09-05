<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonProgressBar,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { exerciseRepository, workoutRepository, workoutSessionRepository } from '@/database/repositories'
import type { Exercise, SetLog, WorkoutExercise } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

import RestTimer from './components/RestTimer.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const toast = useToast()

const session = useLiveQuery(() => workoutSessionRepository.get(props.sessionId), undefined, [() => props.sessionId])
const exerciseSessions = useLiveQuery(
  () => workoutSessionRepository.getExerciseSessions(props.sessionId),
  [],
  [() => props.sessionId],
)
const setLogsByExerciseSession = useLiveQuery(
  async () => {
    const result: Record<string, SetLog[]> = {}
    for (const es of exerciseSessions.value) {
      result[es.id] = await workoutSessionRepository.getSetLogs(es.id)
    }
    return result
  },
  {} as Record<string, SetLog[]>,
  [exerciseSessions],
)

const plans = ref<Record<string, WorkoutExercise>>({})
const exercisesById = ref<Record<string, Exercise>>({})

watch(
  session,
  async (s) => {
    if (!s) return
    const workoutExercises = await workoutRepository.getExercises(s.workoutId)
    for (const we of workoutExercises) plans.value[we.exerciseId] = we
  },
  { immediate: true },
)

watch(
  exerciseSessions,
  async (list) => {
    const missing = [...new Set(list.map((es) => es.exerciseId))].filter((id) => !exercisesById.value[id])
    if (!missing.length) return
    for (const exercise of await exerciseRepository.getMany(missing)) {
      exercisesById.value[exercise.id] = exercise
    }
  },
  { immediate: true },
)

const currentIndex = ref(0)
let positionInitialized = false
watch(
  [exerciseSessions, setLogsByExerciseSession],
  () => {
    if (positionInitialized || !exerciseSessions.value.length) return
    const allPlansLoaded = exerciseSessions.value.every((es) => plans.value[es.exerciseId])
    if (!allPlansLoaded) return
    const firstIncomplete = exerciseSessions.value.findIndex((es) => {
      const plan = plans.value[es.exerciseId]
      const done = setLogsByExerciseSession.value[es.id]?.length ?? 0
      return done < plan.sets
    })
    currentIndex.value = firstIncomplete === -1 ? exerciseSessions.value.length - 1 : firstIncomplete
    positionInitialized = true
  },
  { immediate: true },
)

const currentExerciseSession = computed(() => exerciseSessions.value[currentIndex.value])
const currentPlan = computed(() =>
  currentExerciseSession.value ? plans.value[currentExerciseSession.value.exerciseId] : undefined,
)
const currentExercise = computed(() =>
  currentExerciseSession.value ? exercisesById.value[currentExerciseSession.value.exerciseId] : undefined,
)
const currentSetLogs = computed(() =>
  currentExerciseSession.value ? (setLogsByExerciseSession.value[currentExerciseSession.value.id] ?? []) : [],
)

function goPrev() {
  currentIndex.value = Math.max(0, currentIndex.value - 1)
  resting.value = false
}
function goNext() {
  currentIndex.value = Math.min(exerciseSessions.value.length - 1, currentIndex.value + 1)
  resting.value = false
}

// --- previous performance (§13 step 2) ---
const lastPerformance = ref<Awaited<ReturnType<typeof workoutSessionRepository.getLastPerformance>>>()
watch(
  currentExerciseSession,
  async (es) => {
    lastPerformance.value = es ? await workoutSessionRepository.getLastPerformance(es.exerciseId, props.sessionId) : undefined
  },
  { immediate: true },
)

// --- logging a set ---
const repsInput = ref<string | number>('')
const weightInput = ref<string | number>('')
const durationInput = ref<string | number>('')
const distanceInput = ref<string | number>('')
const resting = ref(false)

watch(currentPlan, (plan) => {
  weightInput.value = plan?.targetWeight ?? ''
  repsInput.value = plan?.repsMax ?? plan?.repsMin ?? ''
  durationInput.value = plan?.durationSeconds ?? ''
  distanceInput.value = plan?.distance ?? ''
})

async function logSet() {
  if (!currentExerciseSession.value || !currentExercise.value || !currentPlan.value) return
  const setLog: SetLog = {
    id: createId(),
    exerciseSessionId: currentExerciseSession.value.id,
    setIndex: currentSetLogs.value.length,
    completedAt: nowIso(),
  }
  if (currentExercise.value.type === 'reps') {
    setLog.reps = Number(repsInput.value) || undefined
    setLog.weight = Number(weightInput.value) || undefined
  } else if (currentExercise.value.type === 'time') {
    setLog.durationSeconds = Number(durationInput.value) || undefined
  } else {
    setLog.distance = Number(distanceInput.value) || undefined
  }

  await workoutSessionRepository.logSet(setLog)

  if (currentPlan.value.restSeconds > 0) {
    resting.value = true
  }
}

async function deleteSet(id: string) {
  await workoutSessionRepository.deleteSet(id)
}

// --- finish / abandon ---
async function finish() {
  const alert = await alertController.create({
    header: 'Завершить тренировку?',
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      {
        text: 'Завершить',
        handler: () => {
          void (async () => {
            const finished = await workoutSessionRepository.finish(props.sessionId)
            await toast.success(
              `Тренировка завершена: ${Math.round(finished.totalVolume ?? 0)} кг за ${Math.round((finished.totalDurationSeconds ?? 0) / 60)} мин`,
            )
            router.replace('/workouts')
          })()
        },
      },
    ],
  })
  await alert.present()
}

async function abandon() {
  const alert = await alertController.create({
    header: 'Отменить тренировку?',
    message: 'Введённые данные останутся в истории, но сессия будет отмечена как незавершённая.',
    buttons: [
      { text: 'Назад', role: 'cancel' },
      {
        text: 'Отменить тренировку',
        role: 'destructive',
        handler: () => {
          void workoutSessionRepository.abandon(props.sessionId).then(() => router.replace('/workouts'))
        },
      },
    ],
  })
  await alert.present()
}

function formatSetLog(log: SetLog, exercise?: Exercise): string {
  if (!exercise) return ''
  if (exercise.type === 'time') return `${log.durationSeconds ?? '—'} сек`
  if (exercise.type === 'distance') return `${log.distance ?? '—'} м`
  return `${log.reps ?? '—'} × ${log.weight ?? 0} кг`
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Тренировка</IonTitle>
        <IonButton slot="end" fill="clear" color="medium" @click="abandon">Отменить</IonButton>
      </IonToolbar>
      <IonProgressBar
        v-if="exerciseSessions.length"
        :value="(currentIndex + 1) / exerciseSessions.length"
      />
    </IonHeader>
    <IonContent class="ion-padding">
      <template v-if="currentExercise && currentPlan">
        <p class="step-indicator">Упражнение {{ currentIndex + 1 }} из {{ exerciseSessions.length }}</p>
        <h2>{{ currentExercise.name }}</h2>
        <p>
          План: {{ currentPlan.sets }} ×
          <template v-if="currentExercise.type === 'reps'">
            {{ currentPlan.repsMin && currentPlan.repsMax ? `${currentPlan.repsMin}-${currentPlan.repsMax}` : currentPlan.repsMin ?? currentPlan.repsMax ?? '—' }}
            <template v-if="currentPlan.targetWeight"> · {{ currentPlan.targetWeight }} кг</template>
          </template>
          <template v-else-if="currentExercise.type === 'time'">{{ currentPlan.durationSeconds }} сек</template>
          <template v-else>{{ currentPlan.distance }} м</template>
        </p>

        <p v-if="lastPerformance" class="last-performance">
          Прошлый раз ({{ lastPerformance.session.date }}):
          {{ lastPerformance.setLogs.map((l) => formatSetLog(l, currentExercise)).join(', ') }}
        </p>

        <IonList>
          <IonItem v-for="log in currentSetLogs" :key="log.id">
            <IonLabel>Подход {{ log.setIndex + 1 }}: {{ formatSetLog(log, currentExercise) }}</IonLabel>
            <IonButton fill="clear" color="danger" slot="end" @click="deleteSet(log.id)">✕</IonButton>
          </IonItem>
        </IonList>

        <RestTimer v-if="resting" :seconds="currentPlan.restSeconds" @done="resting = false" />

        <div v-else class="set-form">
          <template v-if="currentExercise.type === 'reps'">
            <IonItem>
              <IonInput v-model="repsInput" type="number" label="Повторения" label-placement="stacked" />
            </IonItem>
            <IonItem>
              <IonInput v-model="weightInput" type="number" label="Вес, кг" label-placement="stacked" />
            </IonItem>
          </template>
          <IonItem v-else-if="currentExercise.type === 'time'">
            <IonInput v-model="durationInput" type="number" label="Время, сек" label-placement="stacked" />
          </IonItem>
          <IonItem v-else>
            <IonInput v-model="distanceInput" type="number" label="Дистанция, м" label-placement="stacked" />
          </IonItem>

          <IonButton expand="block" @click="logSet">Записать подход</IonButton>
        </div>

        <div class="nav-row">
          <IonButton fill="outline" :disabled="currentIndex === 0" @click="goPrev">← Назад</IonButton>
          <IonButton fill="outline" :disabled="currentIndex === exerciseSessions.length - 1" @click="goNext">Далее →</IonButton>
        </div>

        <IonButton expand="block" color="success" style="margin-top: 24px" @click="finish">Завершить тренировку</IonButton>
      </template>
      <p v-else>Загрузка…</p>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.step-indicator {
  color: var(--ion-color-medium);
  margin-bottom: 0;
}

.last-performance {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.set-form {
  margin: 16px 0;
}

.nav-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}
</style>
