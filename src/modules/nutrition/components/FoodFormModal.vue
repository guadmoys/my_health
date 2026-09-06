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
import { reactive, ref } from 'vue'

import type { Food, PortionUnit } from '@/database/types'

import { foodFormSchema } from '../schemas'

const props = defineProps<{ food?: Food }>()

type NumericInput = string | number | null

const form = reactive({
  name: props.food?.name ?? '',
  category: props.food?.category ?? '',
  kcalPer100: (props.food?.kcalPer100 ?? null) as NumericInput,
  proteinPer100: (props.food?.proteinPer100 ?? null) as NumericInput,
  fatPer100: (props.food?.fatPer100 ?? null) as NumericInput,
  carbsPer100: (props.food?.carbsPer100 ?? null) as NumericInput,
  fiberPer100: (props.food?.fiberPer100 ?? null) as NumericInput,
  defaultPortion: (props.food?.defaultPortion ?? null) as NumericInput,
  defaultUnit: (props.food?.defaultUnit ?? 'g') as PortionUnit,
})

const errors = ref<string[]>([])

// IonInput always emits a string via v-model, even for type="number".
function toNumberOrUndefined(v: NumericInput): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function submit() {
  const result = foodFormSchema.safeParse({
    name: form.name,
    category: form.category,
    kcalPer100: toNumberOrUndefined(form.kcalPer100),
    proteinPer100: toNumberOrUndefined(form.proteinPer100),
    fatPer100: toNumberOrUndefined(form.fatPer100),
    carbsPer100: toNumberOrUndefined(form.carbsPer100),
    fiberPer100: toNumberOrUndefined(form.fiberPer100),
    defaultPortion: toNumberOrUndefined(form.defaultPortion),
    defaultUnit: form.defaultUnit,
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
      <IonTitle>{{ food ? 'Изменить продукт' : 'Новый продукт' }}</IonTitle>
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
        <IonInput v-model="form.name" label="Название" label-placement="stacked" placeholder="Куриная грудка" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.category" label="Категория" label-placement="stacked" placeholder="Мясо" />
      </IonItem>
      <IonItem>
        <IonSelect v-model="form.defaultUnit" label="Единица по умолчанию" label-placement="stacked">
          <IonSelectOption value="g">граммы</IonSelectOption>
          <IonSelectOption value="ml">мл</IonSelectOption>
          <IonSelectOption value="pcs">штуки</IonSelectOption>
          <IonSelectOption value="portion">порция</IonSelectOption>
        </IonSelect>
      </IonItem>
      <IonItem v-if="form.defaultUnit === 'pcs' || form.defaultUnit === 'portion'">
        <IonInput
          v-model="form.defaultPortion"
          type="number"
          label="Вес одной штуки/порции, г"
          label-placement="stacked"
        />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.kcalPer100" type="number" label="Ккал / 100г" label-placement="stacked" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.proteinPer100" type="number" label="Белки / 100г" label-placement="stacked" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.fatPer100" type="number" label="Жиры / 100г" label-placement="stacked" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.carbsPer100" type="number" label="Углеводы / 100г" label-placement="stacked" />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.fiberPer100" type="number" label="Клетчатка / 100г" label-placement="stacked" />
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
