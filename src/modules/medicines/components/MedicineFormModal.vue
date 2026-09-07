<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { reactive, ref } from 'vue'

import type { Medicine, MedicineEffect } from '@/database/types'

import { medicineFormSchema } from '../schemas'

const props = defineProps<{ medicine?: Medicine }>()

const form = reactive({
  category: props.medicine?.category ?? '',
  name: props.medicine?.name ?? '',
  link: props.medicine?.link ?? '',
  comment: props.medicine?.comment ?? '',
  effect: (props.medicine?.effect ?? 'unknown') as MedicineEffect,
})

const errors = ref<string[]>([])

function submit() {
  const result = medicineFormSchema.safeParse({
    category: form.category,
    name: form.name,
    link: form.link,
    comment: form.comment,
    effect: form.effect,
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
      <IonTitle>{{ medicine ? 'Изменить лекарство' : 'Новое лекарство' }}</IonTitle>
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
        <IonInput
          v-model="form.category"
          label="От чего (симптом/категория)"
          label-placement="stacked"
          placeholder="Нос от заложенности"
        />
      </IonItem>
      <IonItem>
        <IonInput v-model="form.name" label="Название лекарства" label-placement="stacked" placeholder="Тизин" />
      </IonItem>
      <IonItem>
        <IonInput
          v-model="form.link"
          type="url"
          label="Ссылка на товар (необязательно)"
          label-placement="stacked"
          placeholder="https://..."
        />
      </IonItem>
      <IonItem>
        <IonTextarea
          v-model="form.comment"
          label="Комментарий (необязательно)"
          label-placement="stacked"
          placeholder="Как принимали, дозировка, побочные эффекты..."
          auto-grow
        />
      </IonItem>
      <IonItem>
        <IonSegment v-model="form.effect">
          <IonSegmentButton value="helped">Помогло</IonSegmentButton>
          <IonSegmentButton value="not_helped">Не помогло</IonSegmentButton>
          <IonSegmentButton value="unknown">Не знаю</IonSegmentButton>
        </IonSegment>
      </IonItem>
    </IonList>
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
