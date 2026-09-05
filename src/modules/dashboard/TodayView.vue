<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonProgressBar,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { presentQuickAdd } from '@/components/layout/quick-add'
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
            <IonCardTitle>Цель</IonCardTitle>
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
            <IonCardTitle>Питание</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <template v-if="nutritionMode === 'hidden' || nutritionMode === 'simplified'">
              <p>Приёмов пищи сегодня: {{ mealCount }}</p>
            </template>
            <div v-else class="stat-row">
              <div class="stat">
                <IonText color="medium"><p>Ккал</p></IonText>
                <p class="stat__value">{{ dailyStats?.calories ?? 0 }}</p>
              </div>
              <div class="stat">
                <IonText color="medium"><p>Белки</p></IonText>
                <p class="stat__value">{{ dailyStats?.protein ?? 0 }}</p>
              </div>
              <div class="stat">
                <IonText color="medium"><p>Жиры</p></IonText>
                <p class="stat__value">{{ dailyStats?.fat ?? 0 }}</p>
              </div>
              <div class="stat">
                <IonText color="medium"><p>Углеводы</p></IonText>
                <p class="stat__value">{{ dailyStats?.carbs ?? 0 }}</p>
              </div>
            </div>
            <IonButton fill="clear" size="small" @click="router.push('/nutrition')">Открыть дневник питания →</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Вода</IonCardTitle>
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
            <IonCardTitle>Сон</IonCardTitle>
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
            <IonCardTitle>Активность</IonCardTitle>
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
            <IonCardTitle>Тренировка</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p v-if="activeSession">Есть незавершённая тренировка.</p>
            <p v-else>Тренировка на сегодня не начата.</p>
            <IonButton size="small" fill="outline" @click="router.push('/workouts')">Перейти к тренировкам →</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Самочувствие</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div class="rating-row">
              <span class="rating-row__label">Энергия</span>
              <IonButton
                v-for="v in ratingScale"
                :key="v"
                size="small"
                :fill="wellbeing?.energy === v ? 'solid' : 'outline'"
                @click="setWellbeingRating('energy', v)"
              >
                {{ v }}
              </IonButton>
            </div>
            <div class="rating-row">
              <span class="rating-row__label">Настроение</span>
              <IonButton
                v-for="v in ratingScale"
                :key="v"
                size="small"
                :fill="wellbeing?.mood === v ? 'solid' : 'outline'"
                @click="setWellbeingRating('mood', v)"
              >
                {{ v }}
              </IonButton>
            </div>
            <div class="rating-row">
              <span class="rating-row__label">Усталость</span>
              <IonButton
                v-for="v in ratingScale"
                :key="v"
                size="small"
                :fill="wellbeing?.fatigue === v ? 'solid' : 'outline'"
                @click="setWellbeingRating('fatigue', v)"
              >
                {{ v }}
              </IonButton>
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

.stat-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat p {
  margin: 0;
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
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.rating-row__label {
  width: 90px;
  flex-shrink: 0;
}

.inline-input {
  margin-top: 12px;
  --padding-start: 0;
}
</style>
