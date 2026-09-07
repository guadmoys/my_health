<script setup lang="ts">
import { IonCardTitle, IonIcon } from '@ionic/vue'

defineProps<{ icon: string }>()
</script>

<template>
  <IonCardTitle class="card-title">
    <IonIcon :icon="icon" aria-hidden="true" />
    <slot />
  </IonCardTitle>
</template>

<style scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title ion-icon {
  font-size: 1.1rem;
  color: var(--ion-color-primary);
}
</style>
