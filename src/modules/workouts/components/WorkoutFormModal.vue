<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { reactive, ref } from 'vue'

import type { Workout } from '@/database/types'

import { workoutFormSchema } from '../schemas'

const props = defineProps<{ workout?: Workout }>()

const form = reactive({
  name: props.workout?.name ?? '',
  category: props.workout?.category ?? '',
  description: props.workout?.description ?? '',
  estimatedMinutes: (props.workout?.estimatedMinutes ?? null) as string | number | null,
})

const errors = ref<string[]>([])

function submit() {
  const minutes = Number(form.estimatedMinutes)
  const result = workoutFormSchema.safeParse({
    name: form.name,
    category: form.category,
    description: form.description || undefined,
    estimatedMinutes: form.estimatedMinutes === null || form.estimatedMinutes === '' || Number.isNaN(minutes) ? undefined : minutes,
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
      <IonTitle>{{ workout ? 'Изменить тренировку' : 'Новая тренировка' }}</IonTitle>
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
        <IonInput v-model="form.name" label="Название" label-placement="stacked" placeholder="Full Body A" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.category" label="Категория" label-placement="stacked" placeholder="strength" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.description" label="Описание" label-placement="stacked" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.estimatedMinutes" type="number" label="Примерная длительность, мин" label-placement="stacked" />
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
