<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useLiveQuery } from '@/composables/useLiveQuery'
import {
  activityRepository,
  dailyStatsRepository,
  goalRepository,
  mealRepository,
  profileRepository,
  sleepRepository,
  waterRepository,
  wellbeingRepository,
  workoutSessionRepository,
} from '@/database/repositories'
import { useUiStore } from '@/stores/ui.store'
import { nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'

const router = useRouter()
const message = useMessage()
const ui = useUiStore()

const date = today()

// Every query here is a Dexie liveQuery: it re-runs automatically whenever a
// write touches the tables it reads, including writes from the quick-add
// sheet or any other component — no manual refresh() plumbing needed.
const nutritionMode = useLiveQuery(
  async () => (await profileRepository.getCurrent())?.nutritionDisplayMode ?? 'full',
  'full' as const,
)
const primaryGoal = useLiveQuery(() => goalRepository.getPrimary(), undefined)
const dailyStats = useLiveQuery(() => dailyStatsRepository.getByDate(date), undefined)
const mealCount = useLiveQuery(
  async () => new Set((await mealRepository.getByDate(date)).map((m) => m.id)).size,
  0,
)
const activeSession = useLiveQuery(() => workoutSessionRepository.getActive(), undefined)
const wellbeing = useLiveQuery(() => wellbeingRepository.getByDate(date), undefined)

const waterMl = computed(() => dailyStats.value?.waterMl ?? 0)
const ratingScale = [1, 2, 3, 4, 5] as const

// --- Water ---
async function addWater(amountMl: number) {
  await waterRepository.add({ id: createId(), date, amountMl, createdAt: nowIso() })
  message.success(`+${amountMl} мл воды`)
}

// --- Sleep (quick manual entry, §18) ---
const sleepHoursInput = ref<number | null>(null)
async function logSleep() {
  if (!sleepHoursInput.value) return
  await sleepRepository.add({
    id: createId(),
    date,
    durationMinutes: Math.round(sleepHoursInput.value * 60),
  })
  sleepHoursInput.value = null
  message.success('Сон записан')
}

// --- Activity (manual steps, §19) ---
const stepsInput = ref<number | null>(null)
async function logSteps() {
  if (!stepsInput.value) return
  await activityRepository.add({ id: createId(), date, type: 'steps', value: stepsInput.value })
  stepsInput.value = null
  message.success('Шаги записаны')
}

// --- Wellbeing (§20 — must take 5-10 seconds) ---
async function setWellbeingRating(field: 'energy' | 'mood' | 'fatigue', value: number) {
  const current = wellbeing.value
  await wellbeingRepository.upsertForDate({
    id: current?.id ?? createId(),
    date,
    energy: current?.energy,
    mood: current?.mood,
    fatigue: current?.fatigue,
    discomfort: current?.discomfort ?? false,
    note: current?.note,
    [field]: value,
  })
}

async function toggleDiscomfort() {
  const current = wellbeing.value
  await wellbeingRepository.upsertForDate({
    id: current?.id ?? createId(),
    date,
    energy: current?.energy,
    mood: current?.mood,
    fatigue: current?.fatigue,
    note: current?.note,
    discomfort: !(current?.discomfort ?? false),
  })
}

// --- Next planned action ---
const nextAction = computed(() => {
  if (activeSession.value) return 'Незавершённая тренировка — можно продолжить.'
  const planned = dailyStats.value?.habitsPlanned ?? 0
  const completed = dailyStats.value?.habitsCompleted ?? 0
  if (planned > completed) return `Осталось привычек на сегодня: ${planned - completed}`
  return 'На сегодня активных задач нет.'
})

// Safety rule (§3, §16, Таблица 24): never suggest more load when discomfort is marked.
const showRestSuggestion = computed(() => wellbeing.value?.discomfort === true)
</script>

<template>
  <n-flex vertical :size="16" style="max-width: 720px; margin: 0 auto">
    <n-card title="Цель" size="small">
      <template v-if="primaryGoal">
        <n-text strong>{{ primaryGoal.title }}</n-text>
        <div v-if="primaryGoal.description">
          <n-text depth="3">{{ primaryGoal.description }}</n-text>
        </div>
      </template>
      <n-text v-else depth="3">Активная цель не выбрана.</n-text>
    </n-card>

    <n-card size="small">
      <n-text>{{ nextAction }}</n-text>
    </n-card>

    <n-card v-if="showRestSuggestion" size="small" :bordered="true">
      <n-text type="warning">
        Отмечен дискомфорт — не увеличивайте нагрузку сегодня, при необходимости снизьте её или отдохните.
      </n-text>
    </n-card>

    <n-card title="Питание" size="small">
      <template v-if="nutritionMode === 'hidden' || nutritionMode === 'simplified'">
        <n-text>Приёмов пищи сегодня: {{ mealCount }}</n-text>
      </template>
      <template v-else>
        <n-flex :size="16">
          <n-statistic label="Ккал" :value="dailyStats?.calories ?? 0" />
          <n-statistic label="Белки" :value="dailyStats?.protein ?? 0" />
          <n-statistic label="Жиры" :value="dailyStats?.fat ?? 0" />
          <n-statistic label="Углеводы" :value="dailyStats?.carbs ?? 0" />
        </n-flex>
      </template>
      <n-button text style="margin-top: 8px" @click="router.push('/nutrition')">Открыть дневник питания →</n-button>
    </n-card>

    <n-card title="Вода" size="small">
      <n-statistic label="Сегодня" :value="waterMl" suffix=" мл" />
      <n-flex style="margin-top: 12px">
        <n-button v-for="amount in [150, 250, 330, 500]" :key="amount" size="small" @click="addWater(amount)">
          +{{ amount }} мл
        </n-button>
      </n-flex>
    </n-card>

    <n-card title="Сон" size="small">
      <n-text v-if="dailyStats?.sleepMinutes">
        Сегодня: {{ Math.floor(dailyStats.sleepMinutes / 60) }} ч {{ dailyStats.sleepMinutes % 60 }} мин
      </n-text>
      <n-text v-else depth="3">Ещё не записан.</n-text>
      <n-flex align="center" style="margin-top: 12px" :size="8">
        <n-input-number v-model:value="sleepHoursInput" placeholder="Часов" :min="0" :max="24" :step="0.5" style="width: 120px" />
        <n-button size="small" :disabled="!sleepHoursInput" @click="logSleep">Записать</n-button>
      </n-flex>
    </n-card>

    <n-card title="Активность" size="small">
      <n-text v-if="dailyStats?.steps">Шаги сегодня: {{ dailyStats.steps }}</n-text>
      <n-text v-else depth="3">Шаги ещё не записаны.</n-text>
      <n-flex align="center" style="margin-top: 12px" :size="8">
        <n-input-number v-model:value="stepsInput" placeholder="Шаги" :min="0" style="width: 140px" />
        <n-button size="small" :disabled="!stepsInput" @click="logSteps">Записать</n-button>
      </n-flex>
    </n-card>

    <n-card title="Тренировка" size="small">
      <n-text v-if="activeSession" type="warning">Есть незавершённая тренировка.</n-text>
      <n-text v-else depth="3">Тренировка на сегодня не начата.</n-text>
      <n-button style="margin-top: 8px" size="small" @click="router.push('/workouts')">Перейти к тренировкам →</n-button>
    </n-card>

    <n-card title="Самочувствие" size="small">
      <n-flex vertical :size="8">
        <n-flex align="center" :size="8">
          <n-text style="width: 80px">Энергия</n-text>
          <n-button
            v-for="v in ratingScale"
            :key="v"
            size="tiny"
            :type="wellbeing?.energy === v ? 'primary' : 'default'"
            @click="setWellbeingRating('energy', v)"
          >
            {{ v }}
          </n-button>
        </n-flex>
        <n-flex align="center" :size="8">
          <n-text style="width: 80px">Настроение</n-text>
          <n-button
            v-for="v in ratingScale"
            :key="v"
            size="tiny"
            :type="wellbeing?.mood === v ? 'primary' : 'default'"
            @click="setWellbeingRating('mood', v)"
          >
            {{ v }}
          </n-button>
        </n-flex>
        <n-flex align="center" :size="8">
          <n-text style="width: 80px">Усталость</n-text>
          <n-button
            v-for="v in ratingScale"
            :key="v"
            size="tiny"
            :type="wellbeing?.fatigue === v ? 'primary' : 'default'"
            @click="setWellbeingRating('fatigue', v)"
          >
            {{ v }}
          </n-button>
        </n-flex>
        <n-checkbox :checked="wellbeing?.discomfort ?? false" @update:checked="toggleDiscomfort">
          Дискомфорт / боль
        </n-checkbox>
      </n-flex>
    </n-card>

    <n-flex justify="center">
      <n-button type="primary" @click="ui.openQuickAdd()">+ Быстрое действие</n-button>
    </n-flex>
  </n-flex>
</template>
