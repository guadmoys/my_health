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

import type { Exercise, WorkoutExercise } from '@/database/types'

import { workoutExerciseFormSchema } from '../schemas'

const props = defineProps<{ exercise: Exercise; existing?: WorkoutExercise }>()

type NumericInput = string | number | null

const form = reactive({
  sets: (props.existing?.sets ?? 3) as NumericInput,
  repsMin: (props.existing?.repsMin ?? null) as NumericInput,
  repsMax: (props.existing?.repsMax ?? null) as NumericInput,
  durationSeconds: (props.existing?.durationSeconds ?? null) as NumericInput,
  distance: (props.existing?.distance ?? null) as NumericInput,
  restSeconds: (props.existing?.restSeconds ?? 60) as NumericInput,
  targetWeight: (props.existing?.targetWeight ?? null) as NumericInput,
})

const errors = ref<string[]>([])

function toNumberOrUndefined(v: NumericInput): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function submit() {
  const result = workoutExerciseFormSchema.safeParse({
    exerciseId: props.exercise.id,
    sets: toNumberOrUndefined(form.sets) ?? 0,
    repsMin: toNumberOrUndefined(form.repsMin),
    repsMax: toNumberOrUndefined(form.repsMax),
    durationSeconds: toNumberOrUndefined(form.durationSeconds),
    distance: toNumberOrUndefined(form.distance),
    restSeconds: toNumberOrUndefined(form.restSeconds) ?? 0,
    targetWeight: toNumberOrUndefined(form.targetWeight),
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
      <IonTitle>{{ exercise.name }}</IonTitle>
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
        <IonInput v-model="form.sets" type="number" label="Подходов" label-placement="stacked" />
      </IonItem>

      <template v-if="exercise.type === 'reps'">
        <IonItem>
          <IonInput v-model="form.repsMin" type="number" label="Повторений, от" label-placement="stacked" />
        </IonItem>
        <IonItem>
          <IonInput v-model="form.repsMax" type="number" label="Повторений, до" label-placement="stacked" />
        </IonItem>
        <IonItem>
          <IonInput v-model="form.targetWeight" type="number" label="Рабочий вес, кг" label-placement="stacked" />
        </IonItem>
      </template>

      <IonItem v-else-if="exercise.type === 'time'">
        <IonInput v-model="form.durationSeconds" type="number" label="Длительность, сек" label-placement="stacked" />
      </IonItem>

      <IonItem v-else>
        <IonInput v-model="form.distance" type="number" label="Дистанция, м" label-placement="stacked" />
      </IonItem>

      <IonItem>
        <IonInput v-model="form.restSeconds" type="number" label="Отдых, сек" label-placement="stacked" />
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
