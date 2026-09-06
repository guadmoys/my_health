<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { computed, reactive, ref, watch } from 'vue'

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
          <IonCardTitle>Статус</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <template v-if="stats.currentCycleDay">
            <p>День цикла: {{ stats.currentCycleDay }}</p>
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

          <template v-if="stats.avgCycleLengthDays || stats.avgPeriodLengthDays">
            <p v-if="stats.avgCycleLengthDays">Средняя длина цикла: {{ stats.avgCycleLengthDays }} дн.</p>
            <p v-if="stats.avgPeriodLengthDays">Средняя длительность менструации: {{ stats.avgPeriodLengthDays }} дн.</p>
          </template>
        </IonCardContent>
      </IonCard>

      <IonCard v-if="cycleWeights.length">
        <IonCardHeader>
          <IonCardTitle>Вес в этом цикле</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p v-for="w in cycleWeights" :key="w.id">{{ w.date }}: {{ w.value }} кг</p>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Сегодня</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonSelect v-model="form.flow" label="Выделения" label-placement="stacked" placeholder="Нет">
                <IonSelectOption :value="undefined">Нет</IonSelectOption>
                <IonSelectOption value="spotting">Мажущие</IonSelectOption>
                <IonSelectOption value="light">Слабые</IonSelectOption>
                <IonSelectOption value="medium">Средние</IonSelectOption>
                <IonSelectOption value="heavy">Сильные</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>

          <div class="rating-row">
            <span class="rating-row__label">Боль</span>
            <IonButton
              v-for="v in ratingScale"
              :key="v"
              size="small"
              :fill="form.pain === v ? 'solid' : 'outline'"
              @click="form.pain = v"
            >
              {{ v }}
            </IonButton>
          </div>
          <div class="rating-row">
            <span class="rating-row__label">Радость</span>
            <IonButton
              v-for="v in ratingScale"
              :key="v"
              size="small"
              :fill="form.mood === v ? 'solid' : 'outline'"
              @click="form.mood = v"
            >
              {{ v }}
            </IonButton>
          </div>

          <IonList>
            <IonItem>
              <IonInput v-model="form.cravings" label="Хочется (необязательно)" label-placement="stacked" placeholder="Шоколад…" />
            </IonItem>
          </IonList>

          <IonButton expand="block" style="margin-top: 12px" @click="save">Сохранить</IonButton>
        </IonCardContent>
      </IonCard>

      <IonList>
        <IonItem v-for="log in history" :key="log.id">
          <IonLabel>
            <h3>{{ log.date }}</h3>
            <p>
              <template v-if="log.flow">Выделения: {{ formatFlow(log.flow) }}</template>
              <template v-if="log.pain"> · Боль {{ log.pain }}/5</template>
              <template v-if="log.mood"> · Радость {{ log.mood }}/5</template>
              <template v-if="log.cravings"> · Хочется: {{ log.cravings }}</template>
            </p>
          </IonLabel>
        </IonItem>
        <IonItem v-if="!history.length">
          <IonLabel color="medium">Пока нет записей</IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.disclaimer {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.rating-row__label {
  width: 70px;
  flex-shrink: 0;
}
</style>
