<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { helpCircleOutline, thumbsDown, thumbsUp } from 'ionicons/icons'
import { reactive, ref } from 'vue'

import { SectionLabel, TilePicker, type TileOption } from '@/components/ui'
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

const effectOptions: TileOption<MedicineEffect>[] = [
  { value: 'helped', icon: thumbsUp, label: 'Помогло', tone: 'good' },
  { value: 'not_helped', icon: thumbsDown, label: 'Не помогло', tone: 'bad' },
  { value: 'unknown', icon: helpCircleOutline, label: 'Не знаю', tone: 'neutral' },
]

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

    <IonList inset>
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
      <IonItem lines="none">
        <IonTextarea
          v-model="form.comment"
          label="Комментарий (необязательно)"
          label-placement="stacked"
          placeholder="Как принимали, дозировка, побочные эффекты..."
          auto-grow
        />
      </IonItem>
    </IonList>

    <SectionLabel>Помогло?</SectionLabel>
    <TilePicker v-model="form.effect" :options="effectOptions" />
  </IonContent>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
