<script setup lang="ts">
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonSelect, IonSelectOption } from '@ionic/vue'
import { computed, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { activityRepository } from '@/database/repositories'
import type { ActivityLog, ActivityType } from '@/database/types'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'
import { periodOptions, periodRange, type Period } from '@/utils/period'

const toast = useToast()
const period = ref<Period>('30')

const logs = useLiveQuery(
  async () => {
    const { from, to } = periodRange(period.value)
    return activityRepository.getRange(from, to)
  },
  [] as ActivityLog[],
  [period],
)

const activeDays = computed(() => new Set(logs.value.map((l) => l.date)).size)
const avgSteps = computed(() => {
  const stepLogs = logs.value.filter((l) => l.type === 'steps' && l.value)
  if (!stepLogs.length) return 0
  return Math.round(stepLogs.reduce((sum, l) => sum + (l.value ?? 0), 0) / stepLogs.length)
})

const typeLabels: Record<ActivityType, string> = {
  steps: 'Шаги',
  walk: 'Прогулка',
  run: 'Бег',
  bike: 'Велосипед',
  swim: 'Плавание',
  other: 'Другое',
}

const typeInput = ref<ActivityType>('steps')
const valueInput = ref<string | number>('')
const durationInput = ref<string | number>('')

async function logActivity() {
  const value = Number(valueInput.value) || undefined
  const durationMinutes = Number(durationInput.value) || undefined
  if (!value && !durationMinutes) return
  await activityRepository.add({ id: createId(), date: today(), type: typeInput.value, value, durationMinutes })
  valueInput.value = ''
  durationInput.value = ''
  await toast.success('Активность записана')
}
</script>

<template>
  <div class="ion-padding">
    <IonSegment v-model="period">
      <IonSegmentButton v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</IonSegmentButton>
    </IonSegment>
  </div>

  <div class="ion-padding-horizontal">
    <p v-if="logs.length">
      Активных дней: <strong>{{ activeDays }}</strong>
      <template v-if="avgSteps"> · в среднем {{ avgSteps }} шагов</template>
    </p>
    <p v-else>Записей активности за этот период ещё нет.</p>
  </div>

  <IonList>
    <IonItem v-for="log in [...logs].reverse().slice(0, 14)" :key="log.id">
      <IonLabel>
        {{ log.date }}: {{ typeLabels[log.type] }}
        <template v-if="log.value"> — {{ log.value }}{{ log.type === 'steps' ? ' шагов' : '' }}</template>
        <template v-if="log.durationMinutes"> · {{ log.durationMinutes }} мин</template>
      </IonLabel>
    </IonItem>
  </IonList>

  <IonList>
    <IonItem>
      <IonSelect v-model="typeInput" label="Тип" label-placement="stacked">
        <IonSelectOption v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</IonSelectOption>
      </IonSelect>
    </IonItem>
    <IonItem>
      <IonInput
        v-model="valueInput"
        type="number"
        :label="typeInput === 'steps' ? 'Шаги' : 'Значение'"
        label-placement="stacked"
      />
    </IonItem>
    <IonItem>
      <IonInput v-model="durationInput" type="number" label="Длительность, мин (необязательно)" label-placement="stacked" />
    </IonItem>
  </IonList>
  <div class="ion-padding">
    <IonButton expand="block" @click="logActivity">Записать активность</IonButton>
  </div>
</template>
