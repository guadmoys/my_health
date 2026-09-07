<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
import dayjs from 'dayjs'
import {
  barbellOutline,
  calendarOutline,
  checkmarkCircleOutline,
  footstepsOutline,
  happyOutline,
  moonOutline,
  pulseOutline,
  restaurantOutline,
  trendingUpOutline,
  waterOutline,
} from 'ionicons/icons'
import { computed, ref } from 'vue'

import { CardTitle, StatBar, type Stat } from '@/components/ui'
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

const weekStatsBar = computed<Stat[]>(() => {
  const result: Stat[] = [
    { value: weekWorkouts.value, label: 'тренировки', tone: 'accent' },
    { value: weekActiveDays.value, label: 'активных дней' },
  ]
  if (weekAvgSleep.value) result.push({ value: formatMinutes(weekAvgSleep.value), label: 'средний сон' })
  if (weekHabitsPercent.value !== undefined) result.push({ value: `${weekHabitsPercent.value}%`, label: 'привычки' })
  return result
})

const workoutsStatsBar = computed<Stat[]>(() => [
  { value: totalWorkouts.value, label: 'тренировок', tone: 'accent' },
  { value: totalWorkoutMinutes.value, label: 'минут' },
  { value: Math.round(totalWorkoutVolume.value), label: 'объём, кг' },
  { value: `${workoutDays.value}/${totalDays.value}`, label: 'регулярность' },
])

const nutritionStatsBar = computed<Stat[]>(() => [
  { value: fmt(avgCalories.value), label: 'ккал', tone: 'accent' },
  { value: fmt(avgProtein.value), label: 'белки' },
  { value: fmt(avgFat.value), label: 'жиры' },
  { value: fmt(avgCarbs.value), label: 'углеводы' },
])

const weightStatsBar = computed<Stat[]>(() => [
  { value: `${fmt(avgWeight.value, 1)} кг`, label: 'среднее', tone: 'accent' },
  { value: `${fmt(minWeight.value, 1)}–${fmt(maxWeight.value, 1)}`, label: 'диапазон, кг' },
])

const activityStatsBar = computed<Stat[]>(() => {
  const result: Stat[] = [{ value: `${activeDaysCount.value}/${totalDays.value}`, label: 'дней активности', tone: 'accent' }]
  if (avgSteps.value) result.push({ value: Math.round(avgSteps.value), label: 'шагов в среднем' })
  if (stepsGoal.value) result.push({ value: `${daysGoalMet.value}/${totalDays.value}`, label: 'цель достигнута' })
  return result
})

const waterStatsBar = computed<Stat[]>(() => [
  { value: `${Math.round(avgWater.value ?? 0)} мл`, label: 'среднее', tone: 'accent' },
  { value: `${daysWithWater.value}/${totalDays.value}`, label: 'дней с записью' },
])

const wellbeingStatsBar = computed<Stat[]>(() => {
  const result: Stat[] = []
  if (avgEnergy.value !== undefined) result.push({ value: `${fmt(avgEnergy.value, 1)}/5`, label: 'энергия', tone: 'accent' })
  if (avgMood.value !== undefined) result.push({ value: `${fmt(avgMood.value, 1)}/5`, label: 'настроение' })
  if (avgFatigue.value !== undefined) result.push({ value: `${fmt(avgFatigue.value, 1)}/5`, label: 'усталость' })
  return result
})

const cycleStatsBar = computed<Stat[]>(() => {
  const result: Stat[] = []
  if (cycleStats.value.avgCycleLengthDays !== undefined)
    result.push({ value: cycleStats.value.avgCycleLengthDays, label: 'длина цикла, дн.', tone: 'accent' })
  if (cycleStats.value.avgPeriodLengthDays !== undefined)
    result.push({ value: cycleStats.value.avgPeriodLengthDays, label: 'менструация, дн.' })
  if (avgCyclePain.value !== undefined) result.push({ value: `${fmt(avgCyclePain.value, 1)}/5`, label: 'боль' })
  if (avgCycleMood.value !== undefined) result.push({ value: `${fmt(avgCycleMood.value, 1)}/5`, label: 'настроение' })
  return result
})
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
          <CardTitle :icon="calendarOutline">Итоги недели</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="weekStatsBar" />
          <p v-if="weekWeightTrend" class="extra-line">Вес: {{ weekWeightTrend }}</p>
        </IonCardContent>
      </IonCard>

      <div class="ion-padding-vertical">
        <IonSegment v-model="period">
          <IonSegmentButton v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</IonSegmentButton>
        </IonSegment>
      </div>

      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="barbellOutline">Тренировки</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="workoutsStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="nutritionMode === 'full'">
        <IonCardHeader>
          <CardTitle :icon="restaurantOutline">Питание</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="nutritionStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgWeight !== undefined">
        <IonCardHeader>
          <CardTitle :icon="trendingUpOutline">Вес</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="weightStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgSleepMinutes !== undefined">
        <IonCardHeader>
          <CardTitle :icon="moonOutline">Сон</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="[{ value: formatMinutes(avgSleepMinutes), label: 'средняя длительность', tone: 'accent' }]" />
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="footstepsOutline">Активность</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="activityStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="waterOutline">Вода</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="waterStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="habitsPercent !== undefined">
        <IonCardHeader>
          <CardTitle :icon="checkmarkCircleOutline">Привычки</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="[{ value: `${habitsPercent}%`, label: 'выполнено', tone: 'accent' }]" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="avgEnergy !== undefined || avgMood !== undefined">
        <IonCardHeader>
          <CardTitle :icon="happyOutline">Самочувствие</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="wellbeingStatsBar" />
        </IonCardContent>
      </IonCard>

      <IonCard v-if="cycleStats.avgCycleLengthDays !== undefined || avgCyclePain !== undefined || avgCycleMood !== undefined">
        <IonCardHeader>
          <CardTitle :icon="pulseOutline">Цикл</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar :stats="cycleStatsBar" />
        </IonCardContent>
      </IonCard>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.extra-line {
  margin-top: 10px;
  font-size: 0.9rem;
  opacity: 0.85;
}
</style>
