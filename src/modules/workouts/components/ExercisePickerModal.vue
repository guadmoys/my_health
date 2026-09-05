<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import { ref } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { exerciseRepository } from '@/database/repositories'
import type { Exercise, ExerciseResultType } from '@/database/types'
import { nowIso } from '@/utils/date'
import { createId } from '@/utils/id'

const query = ref('')
const exercises = useLiveQuery(() => exerciseRepository.find({ query: query.value }), [] as Exercise[], [query])

const creatingCustom = ref(false)
const customName = ref('')
const customCategory = ref('')
const customType = ref<ExerciseResultType>('reps')

function pick(exercise: Exercise) {
  modalController.dismiss(exercise, 'confirm')
}

async function createCustom() {
  if (!customName.value.trim()) return
  const exercise: Exercise = {
    id: createId(),
    name: customName.value.trim(),
    category: customCategory.value.trim() || 'custom',
    muscles: [],
    equipment: [],
    type: customType.value,
    custom: true,
    archived: false,
    createdAt: nowIso(),
  }
  await exerciseRepository.add(exercise)
  pick(exercise)
}

function cancel() {
  modalController.dismiss(null, 'cancel')
}
</script>

<template>
  <IonHeader>
    <IonToolbar>
      <IonTitle>Выбрать упражнение</IonTitle>
      <IonButtons slot="start">
        <IonButton @click="cancel">Отмена</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent class="ion-padding">
    <template v-if="!creatingCustom">
      <IonSearchbar v-model="query" placeholder="Поиск упражнения" />
      <IonList>
        <IonItem v-for="exercise in exercises" :key="exercise.id" button @click="pick(exercise)">
          <IonLabel>
            <h2>{{ exercise.name }}</h2>
            <p>{{ exercise.category }}</p>
          </IonLabel>
        </IonItem>
        <IonItem v-if="!exercises.length">
          <IonLabel color="medium">Ничего не найдено</IonLabel>
        </IonItem>
      </IonList>
      <IonButton expand="block" fill="outline" @click="creatingCustom = true">+ Своё упражнение</IonButton>
    </template>

    <template v-else>
      <IonList>
        <IonItem>
          <IonInput v-model="customName" label="Название" label-placement="stacked" />
        </IonItem>
        <IonItem>
          <IonInput v-model="customCategory" label="Категория" label-placement="stacked" />
        </IonItem>
        <IonItem>
          <IonSelect v-model="customType" label="Тип результата" label-placement="stacked">
            <IonSelectOption value="reps">Повторения</IonSelectOption>
            <IonSelectOption value="time">Время</IonSelectOption>
            <IonSelectOption value="distance">Дистанция</IonSelectOption>
          </IonSelect>
        </IonItem>
      </IonList>
      <IonButton expand="block" :disabled="!customName.trim()" @click="createCustom">Создать и выбрать</IonButton>
      <IonButton expand="block" fill="clear" @click="creatingCustom = false">Назад к поиску</IonButton>
    </template>
  </IonContent>
</template>
