<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import {
  barbellOutline,
  calendarOutline,
  checkmarkCircleOutline,
  settingsOutline,
  statsChartOutline,
  trophyOutline,
} from 'ionicons/icons'

const links = [
  { label: 'Тренировки', to: '/workouts', icon: barbellOutline },
  { label: 'Календарь', to: '/calendar', icon: calendarOutline },
  { label: 'Привычки', to: '/habits', icon: checkmarkCircleOutline },
  { label: 'Аналитика', to: '/analytics', icon: statsChartOutline },
  { label: 'Достижения', to: '/achievements', icon: trophyOutline },
  { label: 'Настройки', to: '/settings', icon: settingsOutline },
]
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Ещё</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItem v-for="link in links" :key="link.to" :router-link="link.to" button lines="full">
          <IonIcon :icon="link.icon" slot="start" aria-hidden="true" />
          <IonLabel>{{ link.label }}</IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>
