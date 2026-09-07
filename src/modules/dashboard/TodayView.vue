<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import {
  barbellOutline,
  batteryHalfOutline,
  closeOutline,
  flagOutline,
  footstepsOutline,
  happyOutline,
  moonOutline,
  restaurantOutline,
  sadOutline,
  waterOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { presentQuickAdd } from '@/components/layout/quick-add'
import { CardTitle, StatBar, TilePicker, type Stat, type TileOption } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import {
  activityRepository,
  dailyStatsRepository,
  goalRepository,
  mealRepository,
  profileRepository,
  settingsRepository,
  sleepRepository,
  waterRepository,
  wellbeingRepository,
  workoutSessionRepository,
} from '@/database/repositories'
import { checkOngoingAchievements, describeAchievement } from '@/modules/motivation/achievements'
import { dismissRule, evaluateRules, type Rule } from '@/modules/motivation/rules'
import { nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'

const router = useRouter()
const toast = useToast()

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
const ratingOptions: TileOption<number>[] = ratingScale.map((v) => ({ value: v, label: String(v), tone: 'accent' }))

const macroStats = computed<Stat[]>(() => [
  { value: dailyStats.value?.calories ?? 0, label: 'ккал', tone: 'accent' },
  { value: dailyStats.value?.protein ?? 0, label: 'белки' },
  { value: dailyStats.value?.fat ?? 0, label: 'жиры' },
  { value: dailyStats.value?.carbs ?? 0, label: 'углеводы' },
])

// --- Water ---
async function addWater(amountMl: number) {
  await waterRepository.add({ id: createId(), date, amountMl, createdAt: nowIso() })
  await toast.success(`+${amountMl} мл воды`)
}

// --- Sleep (quick manual entry, §18) ---
const sleepHoursInput = ref<string | number | null>(null)
async function logSleep() {
  const hours = Number(sleepHoursInput.value)
  if (!hours) return
  await sleepRepository.add({
    id: createId(),
    date,
    durationMinutes: Math.round(hours * 60),
  })
  sleepHoursInput.value = null
  await toast.success('Сон записан')
}

// --- Activity (manual steps, §19) ---
const stepsGoal = useLiveQuery(() => settingsRepository.getValue<number | null>('stepsGoal', null), null)
const stepsProgress = computed(() => {
  if (!stepsGoal.value || !dailyStats.value?.steps) return 0
  return Math.min(1, dailyStats.value.steps / stepsGoal.value)
})

// Steps are a running daily total, so the input starts prefilled with
// today's already-logged count (once) rather than an empty box to refill.
const stepsInput = ref<string | number | null>(null)
let stepsPrefilled = false
watch(
  dailyStats,
  (stats) => {
    if (stepsPrefilled || stats?.steps === undefined) return
    stepsInput.value = stats.steps
    stepsPrefilled = true
  },
  { immediate: true },
)

async function logSteps() {
  const steps = Number(stepsInput.value)
  if (!steps) return
  await activityRepository.upsertStepsForDate(date, steps)
  await toast.success('Шаги записаны')
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

// --- Local rule engine (§24): transparent, dismissible, never auto-changes data ---
const rules = useLiveQuery(() => evaluateRules(), [] as Rule[])
async function dismiss(rule: Rule) {
  await dismissRule(rule)
}

// --- Achievements (§23): checked once per Today mount, not reactively ---
void checkOngoingAchievements().then(async (unlocked) => {
  for (const key of unlocked) {
    await toast.success(await describeAchievement(key))
  }
})
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Сегодня</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <div class="today-stack">
        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="flagOutline">Цель</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <template v-if="primaryGoal">
              <p><strong>{{ primaryGoal.title }}</strong></p>
              <p v-if="primaryGoal.description">{{ primaryGoal.description }}</p>
            </template>
            <p v-else>Активная цель не выбрана.</p>
          </IonCardContent>
        </IonCard>

        <IonCard v-for="rule in rules" :key="rule.id" :color="rule.priority >= 100 ? 'warning' : undefined">
          <IonCardContent class="rule-card">
            <span>{{ rule.text }}</span>
            <IonButton fill="clear" size="small" @click="dismiss(rule)">
              <IonIcon :icon="closeOutline" slot="icon-only" aria-label="Скрыть подсказку" />
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="restaurantOutline">Питание</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <template v-if="nutritionMode === 'hidden' || nutritionMode === 'simplified'">
              <p>Приёмов пищи сегодня: {{ mealCount }}</p>
            </template>
            <StatBar v-else :stats="macroStats" />
            <IonButton fill="clear" size="small" @click="router.push('/nutrition')">Открыть дневник питания →</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="waterOutline">Вода</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p class="stat__value">{{ waterMl }} мл</p>
            <div class="button-row">
              <IonButton v-for="amount in [150, 250, 330, 500]" :key="amount" size="small" fill="outline" @click="addWater(amount)">
                +{{ amount }} мл
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="moonOutline">Сон</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p v-if="dailyStats?.sleepMinutes">
              Сегодня: {{ Math.floor(dailyStats.sleepMinutes / 60) }} ч {{ dailyStats.sleepMinutes % 60 }} мин
            </p>
            <p v-else>Ещё не записан.</p>
            <IonItem lines="none" class="inline-input">
              <IonInput
                v-model="sleepHoursInput"
                type="number"
                placeholder="Часов"
                :min="0"
                :max="24"
                step="0.5"
              />
              <IonButton slot="end" size="small" :disabled="!sleepHoursInput" @click="logSleep">Записать</IonButton>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="footstepsOutline">Активность</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p v-if="dailyStats?.steps">
              Шаги сегодня: {{ dailyStats.steps }}<template v-if="stepsGoal"> из {{ stepsGoal }}</template>
            </p>
            <p v-else>Шаги ещё не записаны.</p>
            <IonProgressBar v-if="stepsGoal" :value="stepsProgress" style="margin: 8px 0" />
            <IonItem lines="none" class="inline-input">
              <IonInput v-model="stepsInput" type="number" placeholder="Шаги" :min="0" />
              <IonButton slot="end" size="small" :disabled="!stepsInput" @click="logSteps">Записать</IonButton>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="barbellOutline">Тренировка</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p v-if="activeSession">Есть незавершённая тренировка.</p>
            <p v-else>Тренировка на сегодня не начата.</p>
            <IonButton size="small" fill="outline" @click="router.push('/workouts')">Перейти к тренировкам →</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <CardTitle :icon="happyOutline">Самочувствие</CardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div class="rating-row">
              <span class="rating-row__label"><IonIcon :icon="happyOutline" aria-hidden="true" /> Настроение</span>
              <TilePicker
                :model-value="wellbeing?.mood ?? 0"
                :options="ratingOptions"
                @update:model-value="setWellbeingRating('mood', $event)"
              />
            </div>
            <div class="rating-row">
              <span class="rating-row__label"><IonIcon :icon="batteryHalfOutline" aria-hidden="true" /> Энергия</span>
              <TilePicker
                :model-value="wellbeing?.energy ?? 0"
                :options="ratingOptions"
                @update:model-value="setWellbeingRating('energy', $event)"
              />
            </div>
            <div class="rating-row">
              <span class="rating-row__label"><IonIcon :icon="sadOutline" aria-hidden="true" /> Усталость</span>
              <TilePicker
                :model-value="wellbeing?.fatigue ?? 0"
                :options="ratingOptions"
                @update:model-value="setWellbeingRating('fatigue', $event)"
              />
            </div>
            <IonItem lines="none">
              <IonCheckbox :checked="wellbeing?.discomfort ?? false" @ion-change="toggleDiscomfort">
                Дискомфорт / боль
              </IonCheckbox>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <div class="button-row" style="justify-content: center">
          <IonButton @click="presentQuickAdd(router)">+ Быстрое действие</IonButton>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.today-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
}

.rule-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat__value {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px;
}

.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.rating-row {
  margin-bottom: 14px;
}

.rating-row:last-of-type {
  margin-bottom: 0;
}

.rating-row__label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-size: 0.85rem;
  opacity: 0.8;
}

.inline-input {
  margin-top: 12px;
  --padding-start: 0;
}
</style>
