<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { computed, reactive, ref } from 'vue'

import type { HabitSchedule } from '@/database/types'

import { habitFormSchema } from '../schemas'

const form = reactive({
  name: '',
  schedule: 'daily' as HabitSchedule,
  targetPerPeriod: 1 as string | number,
})

const errors = ref<string[]>([])

// A daily habit is either done or not each day; only weekly habits have a
// meaningful "N times per week" target for the user to set.
const showTarget = computed(() => form.schedule === 'weekly')

function submit() {
  const result = habitFormSchema.safeParse({
    name: form.name,
    schedule: form.schedule,
    targetPerPeriod: form.schedule === 'daily' ? 1 : Number(form.targetPerPeriod) || 0,
  })

  if (!result.success) {
    errors.value = result.error.issues.map((i) => i.message)
    return
  }

  modalController.dismiss(result.data, 'confirm')
}

function cancel() {
  modalController.dismiss(null, 'cancel')
}
</script>

<template>
  <IonHeader>
    <IonToolbar>
      <IonTitle>Новая привычка</IonTitle>
      <IonButtons slot="start">
        <IonButton @click="cancel">Отмена</IonButton>
      </IonButtons>
      <IonButtons slot="end">
        <IonButton strong @click="submit">Сохранить</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent class="ion-padding">
    <p v-for="err in errors" :key="err" class="error">{{ err }}</p>
    <IonList>
      <IonItem>
        <IonInput v-model="form.name" label="Название" label-placement="stacked" placeholder="Пить воду" />
      </IonItem>
      <IonItem>
        <IonSelect v-model="form.schedule" label="Периодичность" label-placement="stacked">
          <IonSelectOption value="daily">Ежедневно</IonSelectOption>
          <IonSelectOption value="weekly">Еженедельно</IonSelectOption>
        </IonSelect>
      </IonItem>
      <IonItem v-if="showTarget">
        <IonInput v-model="form.targetPerPeriod" type="number" label="Раз в неделю" label-placement="stacked" />
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
