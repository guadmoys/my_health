<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

withDefaults(defineProps<{ tone?: 'good' | 'bad' | 'neutral' | 'accent'; icon?: string }>(), {
  tone: 'neutral',
})
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <IonIcon v-if="icon" :icon="icon" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge ion-icon {
  font-size: 0.9rem;
}

.badge--good {
  color: var(--ion-color-success-shade, var(--ion-color-success));
  background: color-mix(in srgb, var(--ion-color-success) 15%, transparent);
}

.badge--bad {
  color: var(--ion-color-danger-shade, var(--ion-color-danger));
  background: color-mix(in srgb, var(--ion-color-danger) 13%, transparent);
}

.badge--accent {
  color: var(--ion-color-primary-shade, var(--ion-color-primary));
  background: color-mix(in srgb, var(--ion-color-primary) 14%, transparent);
}

.badge--neutral {
  color: var(--ion-color-medium-shade, var(--ion-color-medium, #92949c));
  background: color-mix(in srgb, var(--ion-color-medium, #92949c) 15%, transparent);
}
</style>
