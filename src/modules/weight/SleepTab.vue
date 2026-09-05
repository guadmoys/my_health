<script setup lang="ts">
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonSelect, IonSelectOption } from '@ionic/vue'
import { computed, ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { sleepRepository } from '@/database/repositories'
import type { SleepLog } from '@/database/types'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'
import { periodOptions, periodRange, type Period } from '@/utils/period'

const toast = useToast()
const period = ref<Period>('30')

const logs = useLiveQuery(
  async () => {
    const { from, to } = periodRange(period.value)
    return sleepRepository.getRange(from, to)
  },
  [] as SleepLog[],
  [period],
)

const avgMinutes = computed(() => {
  if (!logs.value.length) return 0
  return Math.round(logs.value.reduce((sum, l) => sum + l.durationMinutes, 0) / logs.value.length)
})
const avgQuality = computed(() => {
  const withQuality = logs.value.filter((l) => l.quality !== undefined)
  if (!withQuality.length) return undefined
  return Math.round((withQuality.reduce((sum, l) => sum + (l.quality ?? 0), 0) / withQuality.length) * 10) / 10
})

const hoursInput = ref<string | number>('')
const qualityInput = ref<1 | 2 | 3 | 4 | 5 | undefined>(undefined)

async function logSleep() {
  const hours = Number(hoursInput.value)
  if (!hours) return
  await sleepRepository.add({
    id: createId(),
    date: today(),
    durationMinutes: Math.round(hours * 60),
    quality: qualityInput.value,
  })
  hoursInput.value = ''
  qualityInput.value = undefined
  await toast.success('Сон записан')
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
      Среднее: <strong>{{ Math.floor(avgMinutes / 60) }} ч {{ avgMinutes % 60 }} мин</strong>
      <template v-if="avgQuality"> · качество {{ avgQuality }}/5</template>
    </p>
    <p v-else>Записей сна за этот период ещё нет.</p>
  </div>

  <IonList>
    <IonItem v-for="log in [...logs].reverse().slice(0, 14)" :key="log.id">
      <IonLabel>
        {{ log.date }}: {{ Math.floor(log.durationMinutes / 60) }} ч {{ log.durationMinutes % 60 }} мин
        <template v-if="log.quality"> · {{ log.quality }}/5</template>
      </IonLabel>
    </IonItem>
  </IonList>

  <IonList>
    <IonItem>
      <IonInput v-model="hoursInput" type="number" step="0.5" label="Часов сна сегодня" label-placement="stacked" />
    </IonItem>
    <IonItem>
      <IonSelect v-model="qualityInput" label="Качество (необязательно)" label-placement="stacked">
        <IonSelectOption v-for="v in [1, 2, 3, 4, 5]" :key="v" :value="v">{{ v }}</IonSelectOption>
      </IonSelect>
    </IonItem>
  </IonList>
  <div class="ion-padding">
    <IonButton expand="block" :disabled="!hoursInput" @click="logSleep">Записать сон</IonButton>
  </div>
</template>
