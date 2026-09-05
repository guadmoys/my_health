<script setup lang="ts">
import { IonButton, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonTextarea, IonTitle, IonToolbar } from '@ionic/vue'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  activityRepository,
  dailyStatsRepository,
  habitRepository,
  mealRepository,
  noteRepository,
  sleepRepository,
  waterRepository,
  weightRepository,
  wellbeingRepository,
  workoutRepository,
  workoutSessionRepository,
} from '@/database/repositories'
import type { DailyStats, Habit, MealType, Workout } from '@/database/types'
import { DATE_FORMAT, today } from '@/utils/date'

const router = useRouter()
const selectedDate = ref(today())

// --- Month highlighting: DailyStats is the cheap precomputed aggregate (§27),
// so fetching a full year of it to mark "has data" days costs one small query. ---
const yearBounds = computed(() => ({
  from: dayjs(selectedDate.value).startOf('year').format(DATE_FORMAT),
  to: dayjs(selectedDate.value).endOf('year').format(DATE_FORMAT),
}))
const statsForYear = useLiveQuery(
  () => dailyStatsRepository.getRange(yearBounds.value.from, yearBounds.value.to),
  [] as DailyStats[],
  [yearBounds],
)

function hasAnyData(s: DailyStats): boolean {
  return Boolean(
    s.calories || s.waterMl || s.workoutCount || s.steps || s.sleepMinutes || s.weight || s.habitsCompleted,
  )
}

const daysWithData = computed(() => new Set(statsForYear.value.filter(hasAnyData).map((s) => s.date)))

function highlightedDates(isoString: string) {
  const date = isoString.slice(0, 10)
  return daysWithData.value.has(date)
    ? { textColor: 'var(--ion-color-primary)', backgroundColor: 'var(--ion-color-primary-tint)' }
    : undefined
}

function onDateChange(value: unknown) {
  if (typeof value === 'string') selectedDate.value = value.slice(0, 10)
}

// --- Day detail: every event type from §16 ---
const meals = useLiveQuery(() => mealRepository.getByDate(selectedDate.value), [], [selectedDate])
const mealItems = useLiveQuery(() => mealRepository.getItemsForDate(selectedDate.value), [], [selectedDate])
const waterTotal = useLiveQuery(() => waterRepository.getDailyTotal(selectedDate.value), 0, [selectedDate])
const weight = useLiveQuery(() => weightRepository.getByDate(selectedDate.value), undefined, [selectedDate])
const sleep = useLiveQuery(() => sleepRepository.getByDate(selectedDate.value), undefined, [selectedDate])
const activities = useLiveQuery(() => activityRepository.getByDate(selectedDate.value), [], [selectedDate])
const wellbeing = useLiveQuery(() => wellbeingRepository.getByDate(selectedDate.value), undefined, [selectedDate])
const sessions = useLiveQuery(() => workoutSessionRepository.getByDate(selectedDate.value), [], [selectedDate])
const notesForDay = useLiveQuery(() => noteRepository.getByDate(selectedDate.value), [], [selectedDate])

const workoutsById = ref<Record<string, Workout>>({})
watch(
  sessions,
  async (list) => {
    const missing = [...new Set(list.map((s) => s.workoutId))].filter((id) => !workoutsById.value[id])
    for (const id of missing) {
      const w = await workoutRepository.get(id)
      if (w) workoutsById.value[id] = w
    }
  },
  { immediate: true },
)

const activeHabits = useLiveQuery(() => habitRepository.getActive(), [] as Habit[])
const habitDoneById = ref<Record<string, boolean>>({})
watch(
  [activeHabits, selectedDate],
  async () => {
    const result: Record<string, boolean> = {}
    for (const habit of activeHabits.value) {
      const log = await habitRepository.getLogForDate(habit.id, selectedDate.value)
      result[habit.id] = log?.completed ?? false
    }
    habitDoneById.value = result
  },
  { immediate: true },
)

function mealsOfType(type: MealType) {
  const ids = new Set(meals.value.filter((m) => m.type === type).map((m) => m.id))
  return mealItems.value.filter((i) => ids.has(i.mealId))
}
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
}

const noteText = ref('')
watch(notesForDay, (list) => (noteText.value = list[0]?.text ?? ''), { immediate: true })
async function saveNote() {
  await noteRepository.upsertForDate(selectedDate.value, noteText.value)
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Календарь</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonDatetime
        presentation="date"
        size="cover"
        :value="selectedDate"
        :highlighted-dates="highlightedDates"
        :first-day-of-week="1"
        @ion-change="onDateChange(($event as CustomEvent).detail.value)"
      />

      <IonListHeader>{{ selectedDate === today() ? 'Сегодня' : selectedDate }}</IonListHeader>

      <template v-if="sessions.length">
        <IonList>
          <IonItem v-for="s in sessions" :key="s.id">
            <IonLabel>
              <h3>🏋️ {{ workoutsById[s.workoutId]?.name ?? 'Тренировка' }}</h3>
              <p v-if="s.status === 'completed'">
                Объём {{ Math.round(s.totalVolume ?? 0) }} кг · {{ Math.round((s.totalDurationSeconds ?? 0) / 60) }} мин
              </p>
              <p v-else>{{ s.status === 'active' ? 'В процессе' : 'Не завершена' }}</p>
            </IonLabel>
          </IonItem>
        </IonList>
      </template>

      <template v-for="type in (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])" :key="type">
        <IonList v-if="mealsOfType(type).length">
          <IonListHeader>🍽️ {{ mealTypeLabels[type] }}</IonListHeader>
          <IonItem v-for="item in mealsOfType(type)" :key="item.id">
            <IonLabel>{{ item.nameSnapshot }} — {{ item.amount }}{{ item.unit === 'g' ? 'г' : item.unit === 'ml' ? 'мл' : 'шт' }}</IonLabel>
          </IonItem>
        </IonList>
      </template>

      <IonList>
        <IonItem v-if="waterTotal">
          <IonLabel>💧 Вода: {{ waterTotal }} мл</IonLabel>
        </IonItem>
        <IonItem v-if="weight">
          <IonLabel>⚖️ Вес: {{ weight.value }} кг</IonLabel>
        </IonItem>
        <IonItem v-if="sleep">
          <IonLabel>
            🌙 Сон: {{ Math.floor(sleep.durationMinutes / 60) }} ч {{ sleep.durationMinutes % 60 }} мин
            <template v-if="sleep.quality"> · {{ sleep.quality }}/5</template>
          </IonLabel>
        </IonItem>
        <IonItem v-for="a in activities" :key="a.id">
          <IonLabel>🚶 {{ a.type }}<template v-if="a.value"> — {{ a.value }}</template></IonLabel>
        </IonItem>
        <IonItem v-if="wellbeing">
          <IonLabel>
            🙂 Самочувствие:
            <template v-if="wellbeing.energy"> энергия {{ wellbeing.energy }}/5</template>
            <template v-if="wellbeing.mood"> · настроение {{ wellbeing.mood }}/5</template>
            <template v-if="wellbeing.discomfort"> · отмечен дискомфорт</template>
          </IonLabel>
        </IonItem>
        <IonItem v-for="habit in activeHabits.filter((h) => habitDoneById[h.id])" :key="habit.id">
          <IonLabel>✅ {{ habit.name }}</IonLabel>
        </IonItem>
      </IonList>

      <IonListHeader>📝 Заметка</IonListHeader>
      <div class="ion-padding">
        <IonTextarea v-model="noteText" placeholder="Заметка на этот день" auto-grow @ion-blur="saveNote" />
        <IonButton size="small" fill="clear" @click="saveNote">Сохранить</IonButton>
      </div>

      <div class="ion-padding">
        <IonButton fill="clear" size="small" @click="router.push('/nutrition')">Открыть питание →</IonButton>
        <IonButton fill="clear" size="small" @click="router.push('/workouts')">Открыть тренировки →</IonButton>
      </div>
    </IonContent>
  </IonPage>
</template>
