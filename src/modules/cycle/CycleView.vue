<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { calendarOutline, pulseOutline, trendingUpOutline, waterOutline } from 'ionicons/icons'
import { computed, reactive, ref, watch } from 'vue'

import { Badge, CardTitle, EmptyState, EntityCard, SectionLabel, StatBar, TilePicker, type Stat, type TileOption } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { cycleRepository, weightRepository } from '@/database/repositories'
import type { CycleFlow, CycleLog, WeightLog } from '@/database/types'
import { today } from '@/utils/date'

import { computeCycleStats } from './cycle-stats'

const toast = useToast()
const date = today()

const logs = useLiveQuery(() => cycleRepository.getAll(), [] as CycleLog[])
const stats = computed(() => computeCycleStats(logs.value, date))

const todayLog = computed(() => logs.value.find((l) => l.date === date))

// --- Today's entry ---
const form = reactive({
  flow: undefined as CycleFlow | undefined,
  pain: undefined as 1 | 2 | 3 | 4 | 5 | undefined,
  mood: undefined as 1 | 2 | 3 | 4 | 5 | undefined,
  cravings: '',
})
let formInitialized = false
watch(
  todayLog,
  (log) => {
    if (formInitialized) return
    form.flow = log?.flow
    form.pain = log?.pain
    form.mood = log?.mood
    form.cravings = log?.cravings ?? ''
    formInitialized = true
  },
  { immediate: true },
)

const ratingScale = [1, 2, 3, 4, 5] as const
const ratingOptions: TileOption<number>[] = ratingScale.map((v) => ({ value: v, label: String(v), tone: 'accent' }))

const painModel = computed<number>({
  get: () => form.pain ?? 0,
  set: (v) => {
    form.pain = v as 1 | 2 | 3 | 4 | 5
  },
})
const moodModel = computed<number>({
  get: () => form.mood ?? 0,
  set: (v) => {
    form.mood = v as 1 | 2 | 3 | 4 | 5
  },
})

const flowOptions: TileOption<CycleFlow | ''>[] = [
  { value: '', label: 'Нет', tone: 'neutral' },
  { value: 'spotting', label: 'Мажущие', tone: 'accent' },
  { value: 'light', label: 'Слабые', tone: 'accent' },
  { value: 'medium', label: 'Средние', tone: 'accent' },
  { value: 'heavy', label: 'Сильные', tone: 'accent' },
]
const flowModel = computed<CycleFlow | ''>({
  get: () => form.flow ?? '',
  set: (v) => {
    form.flow = v || undefined
  },
})

const statusStats = computed<Stat[]>(() => {
  const result: Stat[] = []
  if (stats.value.currentCycleDay) result.push({ value: stats.value.currentCycleDay, label: 'день цикла', tone: 'accent' })
  if (stats.value.avgCycleLengthDays) result.push({ value: stats.value.avgCycleLengthDays, label: 'ср. длина цикла' })
  if (stats.value.avgPeriodLengthDays) result.push({ value: stats.value.avgPeriodLengthDays, label: 'ср. менструация' })
  return result
})

async function save() {
  await cycleRepository.upsertForDate(date, {
    flow: form.flow,
    pain: form.pain,
    mood: form.mood,
    cravings: form.cravings || undefined,
  })
  await toast.success('Записано')
}

// --- Weight during the current cycle (§17 tie-in) ---
const cycleWeights = ref<WeightLog[]>([])
watch(
  () => stats.value.periodStarts.at(-1),
  async (lastStart) => {
    cycleWeights.value = lastStart ? await weightRepository.getRange(lastStart, date) : []
  },
  { immediate: true },
)

const history = computed(() => [...logs.value].reverse().slice(0, 14))

function formatFlow(flow?: CycleFlow): string {
  if (!flow) return ''
  return { spotting: 'Мажущие', light: 'Слабые', medium: 'Средние', heavy: 'Сильные' }[flow]
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Цикл</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="pulseOutline">Статус</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <StatBar v-if="statusStats.length" :stats="statusStats" class="ion-margin-bottom" />
          <template v-if="stats.currentCycleDay">
            <template v-if="stats.predictedNextPeriod">
              <p>Ожидаемое начало следующего цикла: {{ stats.predictedNextPeriod }}</p>
              <p>Примерная овуляция: {{ stats.ovulationEstimate }}</p>
              <p>Возможное фертильное окно: {{ stats.fertileWindowStart }} – {{ stats.fertileWindowEnd }}</p>
              <p class="disclaimer">
                Это простая оценка на основе ваших предыдущих записей, а не медицинский прогноз.
              </p>
            </template>
            <p v-else class="disclaimer">
              Отметьте начало ещё одного цикла, чтобы увидеть оценку следующего и фертильного окна.
            </p>
          </template>
          <p v-else>Записей пока нет. Отметьте дни цикла ниже, чтобы увидеть статус.</p>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="cycleWeights.length">
        <IonCardHeader>
          <CardTitle :icon="trendingUpOutline">Вес в этом цикле</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p v-for="w in cycleWeights" :key="w.id">{{ w.date }}: {{ w.value }} кг</p>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="calendarOutline">Сегодня</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <SectionLabel>Выделения</SectionLabel>
          <TilePicker v-model="flowModel" :options="flowOptions" />

          <SectionLabel>Боль</SectionLabel>
          <TilePicker v-model="painModel" :options="ratingOptions" />

          <SectionLabel>Радость</SectionLabel>
          <TilePicker v-model="moodModel" :options="ratingOptions" />

          <IonList class="ion-margin-top">
            <IonItem>
              <IonInput v-model="form.cravings" label="Хочется (необязательно)" label-placement="stacked" placeholder="Шоколад…" />
            </IonItem>
          </IonList>

          <IonButton expand="block" style="margin-top: 12px" @click="save">Сохранить</IonButton>
        </IonCardContent>
      </IonCard>

      <SectionLabel>История</SectionLabel>
      <div v-if="history.length" class="history">
        <EntityCard
          v-for="log in history"
          :key="log.id"
          :avatar-icon="waterOutline"
          :accent="log.flow ? 'accent' : 'none'"
          :clickable="false"
        >
          <template #title>{{ log.date }}</template>
          <template v-if="log.cravings" #description>Хочется: {{ log.cravings }}</template>
          <template v-if="log.flow || log.pain || log.mood" #footer>
            <Badge v-if="log.flow" tone="accent">{{ formatFlow(log.flow) }}</Badge>
            <Badge v-if="log.pain">Боль {{ log.pain }}/5</Badge>
            <Badge v-if="log.mood">Радость {{ log.mood }}/5</Badge>
          </template>
        </EntityCard>
      </div>
      <EmptyState v-else :icon="waterOutline" title="Пока нет записей" />
    </IonContent>
  </IonPage>
</template>

<style scoped>
.disclaimer {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.history {
  display: grid;
  gap: 10px;
}
</style>
