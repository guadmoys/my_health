<script setup lang="ts">
import { IonIcon, IonNote } from '@ionic/vue'

defineProps<{ icon: string; title: string; note?: string }>()
</script>

<template>
  <div class="empty-state">
    <IonIcon :icon="icon" class="empty-state__icon" aria-hidden="true" />
    <p class="empty-state__title">{{ title }}</p>
    <IonNote v-if="note">{{ note }}</IonNote>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 56px 24px;
  opacity: 0.9;
}

.empty-state__icon {
  font-size: 2.6rem;
  opacity: 0.35;
  margin-bottom: 4px;
}

.empty-state__title {
  margin: 0;
  font-weight: 600;
  font-size: 1.05rem;
}
</style>
