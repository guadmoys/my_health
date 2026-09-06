<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { cycleRepository, dailyStatsRepository, profileRepository, settingsRepository, wellbeingRepository } from '@/database/repositories'
import type { CycleLog, DailyStats, WellbeingLog } from '@/database/types'
import { computeCycleStats } from '@/modules/cycle/cycle-stats'
import { today } from '@/utils/date'
import { currentWeekRange, periodOptions, periodRange, type Period } from '@/utils/period'
import { average, formatMinutes, sum } from '@/utils/stats'

const nutritionMode = useLiveQuery(
  async () => (await profileRepository.getCurrent())?.nutritionDisplayMode ?? 'full',
  'full' as const,
)

// --- Weekly Review (§26): always the current Monday-start week ---
const weekRange = currentWeekRange()
const weekStats = useLiveQuery(() => dailyStatsRepository.getRange(weekRange.from, weekRange.to), [] as DailyStats[])

const weekWorkouts = computed(() => sum(weekStats.value, (s) => s.workoutCount))
const weekActiveDays = computed(
  () => weekStats.value.filter((s) => (s.workoutCount ?? 0) > 0 || (s.steps ?? 0) > 0 || (s.activityMinutes ?? 0) > 0).length,
)
const weekAvgSleep = computed(() => average(weekStats.value, (s) => s.sleepMinutes))
const weekHabitsPercent = computed(() => {
  const planned = sum(weekStats.value, (s) => s.habitsPlanned)
  if (!planned) return undefined
  return Math.round((sum(weekStats.value, (s) => s.habitsCompleted) / planned) * 100)
})
// "Показывать тренд только если пользователь ведёт его" — omit weight from the
// review entirely when there's nothing logged this week, rather than a "no data" line.
const weekWeightEntries = computed(() => weekStats.value.filter((s) => s.weight !== undefined))
const weekWeightTrend = computed(() => {
  const entries = weekWeightEntries.value
  if (!entries.length) return undefined
  const latest = entries.at(-1)!.weight!
  if (entries.length === 1) return `${latest} кг`
  const delta = Math.round((latest - entries[0].weight!) * 10) / 10
  return `${latest} кг (${delta > 0 ? '+' : ''}${delta} за неделю)`
})

// --- Analytics (§25): period-based breakdown over precomputed DailyStats ---
const period = ref<Period>('30')
const range = computed(() => periodRange(period.value))
const stats = useLiveQuery(() => dailyStatsRepository.getRange(range.value.from, range.value.to), [] as DailyStats[], [range])
const wellbeingLogs = useLiveQuery(
  () => wellbeingRepository.getRange(range.value.from, range.value.to),
  [] as WellbeingLog[],
  [range],
)

// The actual number of calendar days in the period — NOT stats.value.length,
// which only counts days that already have a DailyStats row (i.e. days with
// at least one logged event). Regularity/fill-rate stats need the full
// period length as their denominator, including days with nothing logged.
const totalDays = computed(() => {
  if (period.value !== 'all') return Number(period.value)
  if (!stats.value.length) return 0
  return dayjs(range.value.to).diff(dayjs(stats.value[0].date), 'day') + 1
})

const workoutDays = computed(() => stats.value.filter((s) => (s.workoutCount ?? 0) > 0).length)
const totalWorkouts = computed(() => sum(stats.value, (s) => s.workoutCount))
const totalWorkoutMinutes = computed(() => sum(stats.value, (s) => s.workoutMinutes))
const totalWorkoutVolume = computed(() => sum(stats.value, (s) => s.workoutVolume))

const avgCalories = computed(() => average(stats.value, (s) => s.calories))
const avgProtein = computed(() => average(stats.value, (s) => s.protein))
const avgFat = computed(() => average(stats.value, (s) => s.fat))
const avgCarbs = computed(() => average(stats.value, (s) => s.carbs))

const weightValues = computed(() => stats.value.map((s) => s.weight).filter((v): v is number => v !== undefined))
const avgWeight = computed(() => average(stats.value, (s) => s.weight))
const minWeight = computed(() => (weightValues.value.length ? Math.min(...weightValues.value) : undefined))
const maxWeight = computed(() => (weightValues.value.length ? Math.max(...weightValues.value) : undefined))

const avgSleepMinutes = computed(() => average(stats.value, (s) => s.sleepMinutes))

const activeDaysCount = computed(
  () => stats.value.filter((s) => (s.steps ?? 0) > 0 || (s.activityMinutes ?? 0) > 0).length,
)
const avgSteps = computed(() => average(stats.value.filter((s) => (s.steps ?? 0) > 0), (s) => s.steps))

const stepsGoal = useLiveQuery(() => settingsRepository.getValue<number | null>('stepsGoal', null), null)
const daysGoalMet = computed(() => stats.value.filter((s) => (s.steps ?? 0) >= (stepsGoal.value ?? Infinity)).length)

const avgWater = computed(() => (totalDays.value ? sum(stats.value, (s) => s.waterMl) / totalDays.value : undefined))
const daysWithWater = computed(() => stats.value.filter((s) => (s.waterMl ?? 0) > 0).length)

const habitsPercent = computed(() => {
  const planned = sum(stats.value, (s) => s.habitsPlanned)
  if (!planned) return undefined
  return Math.round((sum(stats.value, (s) => s.habitsCompleted) / planned) * 100)
})

const avgEnergy = computed(() => average(wellbeingLogs.value, (w) => w.energy))
const avgMood = computed(() => average(wellbeingLogs.value, (w) => w.mood))
const avgFatigue = computed(() => average(wellbeingLogs.value, (w) => w.fatigue))

// --- Cycle (§ menstrual cycle tracking): overall stats from all-time logs, ---
// --- but pain/mood averages scoped to the selected period like everything else. ---
const cycleLogs = useLiveQuery(() => cycleRepository.getAll(), [] as CycleLog[])
const cycleStats = computed(() => computeCycleStats(cycleLogs.value, today()))
const periodCycleLogs = computed(() =>
  cycleLogs.value.filter((l) => l.date >= range.value.from && l.date <= range.value.to),
)
const avgCyclePain = computed(() => average(periodCycleLogs.value, (l) => l.pain))
const avgCycleMood = computed(() => average(periodCycleLogs.value, (l) => l.mood))

function fmt(n: number | undefined, digits = 0): string {
  return n === undefined ? '—' : n.toFixed(digits)
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Аналитика</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Итоги недели</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Тренировки: {{ weekWorkouts }}</p>
          <p>Активных дней: {{ weekActiveDays }}</p>
          <p v-if="weekAvgSleep">Средний сон: {{ formatMinutes(weekAvgSleep) }}</p>
          <p v-if="weekHabitsPercent !== undefined">Привычки: {{ weekHabitsPercent }}%</p>
          <p v-if="weekWeightTrend">Вес: {{ weekWeightTrend }}</p>
        </IonCardContent>
      </IonCard>

      <div class="ion-padding-vertical">
        <IonSegment v-model="period">
          <IonSegmentButton v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</IonSegmentButton>
        </IonSegment>
      </div>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Тренировки</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Количество: {{ totalWorkouts }}</p>
          <p>Минуты: {{ totalWorkoutMinutes }}</p>
          <p>Объём: {{ Math.round(totalWorkoutVolume) }} кг</p>
          <p>Регулярность: {{ workoutDays }} из {{ totalDays }} дней</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="nutritionMode === 'full'">
        <IonCardHeader>
          <IonCardTitle>Питание</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Среднее: {{ fmt(avgCalories) }} ккал</p>
          <p>Белки {{ fmt(avgProtein) }} · Жиры {{ fmt(avgFat) }} · Углеводы {{ fmt(avgCarbs) }}</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgWeight !== undefined">
        <IonCardHeader>
          <IonCardTitle>Вес</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Среднее: {{ fmt(avgWeight, 1) }} кг</p>
          <p>Диапазон: {{ fmt(minWeight, 1) }}–{{ fmt(maxWeight, 1) }} кг</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgSleepMinutes !== undefined">
        <IonCardHeader>
          <IonCardTitle>Сон</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Средняя длительность: {{ formatMinutes(avgSleepMinutes) }}</p>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Активность</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Дни активности: {{ activeDaysCount }} из {{ totalDays }}</p>
          <p v-if="avgSteps">В среднем: {{ Math.round(avgSteps) }} шагов</p>
          <p v-if="stepsGoal">Цель по шагам достигнута: {{ daysGoalMet }} из {{ totalDays }} дней</p>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Вода</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Среднее: {{ Math.round(avgWater ?? 0) }} мл</p>
          <p>Дней с записью: {{ daysWithWater }} из {{ totalDays }}</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="habitsPercent !== undefined">
        <IonCardHeader>
          <IonCardTitle>Привычки</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Выполнено: {{ habitsPercent }}%</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgEnergy !== undefined || avgMood !== undefined">
        <IonCardHeader>
          <IonCardTitle>Самочувствие</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p v-if="avgEnergy !== undefined">Энергия: {{ fmt(avgEnergy, 1) }}/5</p>
          <p v-if="avgMood !== undefined">Настроение: {{ fmt(avgMood, 1) }}/5</p>
          <p v-if="avgFatigue !== undefined">Усталость: {{ fmt(avgFatigue, 1) }}/5</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="cycleStats.avgCycleLengthDays !== undefined || avgCyclePain !== undefined || avgCycleMood !== undefined">
        <IonCardHeader>
          <IonCardTitle>Цикл</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p v-if="cycleStats.avgCycleLengthDays !== undefined">Средняя длина цикла: {{ cycleStats.avgCycleLengthDays }} дн.</p>
          <p v-if="cycleStats.avgPeriodLengthDays !== undefined">Средняя длина менструации: {{ cycleStats.avgPeriodLengthDays }} дн.</p>
          <p v-if="avgCyclePain !== undefined">Боль (за период): {{ fmt(avgCyclePain, 1) }}/5</p>
          <p v-if="avgCycleMood !== undefined">Настроение в цикле (за период): {{ fmt(avgCycleMood, 1) }}/5</p>
        </IonCardContent>
      </IonCard>
    </IonContent>
  </IonPage>
</template>
