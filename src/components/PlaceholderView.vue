<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

withDefaults(defineProps<{ title: string; description?: string }>(), {
  description: 'Этот раздел ещё не реализован.',
})
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ title }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <div class="placeholder">
        <p>{{ description }}</p>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60%;
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
