<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
import { ref } from 'vue'

import ActivityTab from './ActivityTab.vue'
import SleepTab from './SleepTab.vue'
import WeightTab from './WeightTab.vue'

const tab = ref<'weight' | 'sleep' | 'activity'>('weight')
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Прогресс</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonSegment v-model="tab">
          <IonSegmentButton value="weight">Вес</IonSegmentButton>
          <IonSegmentButton value="sleep">Сон</IonSegmentButton>
          <IonSegmentButton value="activity">Активность</IonSegmentButton>
        </IonSegment>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <WeightTab v-if="tab === 'weight'" />
      <SleepTab v-else-if="tab === 'sleep'" />
      <ActivityTab v-else />
    </IonContent>
  </IonPage>
</template>
