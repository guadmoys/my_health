<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

// PWA/offline: lets a waiting service worker take over on demand, instead of
// silently swapping the app under the user mid-session (§ PWA/offline).
const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<template>
  <div v-if="needRefresh" class="pwa-update-banner">
    <span>Доступно обновление приложения.</span>
    <IonButton size="small" @click="updateServiceWorker()">Обновить</IonButton>
  </div>
</template>

<style scoped>
.pwa-update-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--ion-color-dark);
  color: var(--ion-color-dark-contrast);
  font-size: 0.9rem;
}
</style>
