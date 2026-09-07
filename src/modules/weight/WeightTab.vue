<script setup lang="ts">
import { IonButton, IonInput, IonItem, IonList, IonSegment, IonSegmentButton } from '@ionic/vue'
import type { EChartsCoreOption } from 'echarts/core'
import { trendingUpOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { EmptyState, StatBar, type Stat } from '@/components/ui'
import { useEChart } from '@/composables/useEChart'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { weightRepository } from '@/database/repositories'
import type { WeightLog } from '@/database/types'
import { nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'
import { movingAverage, periodOptions, periodRange, type Period } from '@/utils/period'

const toast = useToast()
const period = ref<Period>('30')

const logs = useLiveQuery(
  async () => {
    const { from, to } = periodRange(period.value)
    return weightRepository.getRange(from, to)
  },
  [] as WeightLog[],
  [period],
)

const chartEl = ref<HTMLElement>()
const chartOptions = computed<EChartsCoreOption>(() => {
  const dates = logs.value.map((l) => l.date)
  const values = logs.value.map((l) => l.value)
  const avg = movingAverage(logs.value, (l) => l.value, 7)
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 10 } },
    tooltip: { trigger: 'axis' },
    series: [
      { name: 'Вес', type: 'line', data: values, symbolSize: 4, lineStyle: { opacity: 0.3 }, itemStyle: { opacity: 0.5 } },
      { name: 'Тренд (7 дней)', type: 'line', data: avg, smooth: true, symbol: 'none', lineStyle: { width: 3 } },
    ],
  }
})
useEChart(chartEl, chartOptions)

const latest = computed(() => logs.value.at(-1))
const first = computed(() => logs.value[0])
const trendDelta = computed(() => {
  if (!latest.value || !first.value || latest.value === first.value) return undefined
  return Math.round((latest.value.value - first.value.value) * 10) / 10
})

const stats = computed<Stat[]>(() => {
  if (!latest.value) return []
  const result: Stat[] = [{ value: `${latest.value.value} кг`, label: latest.value.date, tone: 'accent' }]
  if (trendDelta.value !== undefined) {
    result.push({
      value: `${trendDelta.value > 0 ? '+' : ''}${trendDelta.value} кг`,
      label: 'за период',
      tone: trendDelta.value > 0 ? 'bad' : 'good',
    })
  }
  return result
})

const weightInput = ref<string | number>('')
const noteInput = ref('')

async function logWeight() {
  const value = Number(weightInput.value)
  if (!value || value <= 0) return
  await weightRepository.add({
    id: createId(),
    date: today(),
    value,
    note: noteInput.value || undefined,
    createdAt: nowIso(),
  })
  weightInput.value = ''
  noteInput.value = ''
  await toast.success('Вес записан')
}
</script>

<template>
  <div class="ion-padding">
    <IonSegment v-model="period">
      <IonSegmentButton v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</IonSegmentButton>
    </IonSegment>
  </div>

  <div v-if="logs.length" class="ion-padding-horizontal">
    <StatBar v-if="stats.length" :stats="stats" class="ion-margin-bottom" />
    <div ref="chartEl" style="height: 220px"></div>
  </div>
  <EmptyState v-else :icon="trendingUpOutline" title="Пока нет записей" note="Записей веса за этот период ещё нет." />

  <IonList>
    <IonItem>
      <IonInput v-model="weightInput" type="number" label="Вес, кг" label-placement="stacked" />
    </IonItem>
    <IonItem>
      <IonInput v-model="noteInput" label="Заметка (необязательно)" label-placement="stacked" />
    </IonItem>
  </IonList>
  <div class="ion-padding">
    <IonButton expand="block" :disabled="!weightInput" @click="logWeight">Записать вес сегодня</IonButton>
  </div>
</template>
