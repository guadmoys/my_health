<script setup lang="ts" generic="T extends string | number">
import { IonIcon } from '@ionic/vue'

export interface TileOption<V> {
  value: V
  label: string
  icon?: string
  tone?: 'good' | 'bad' | 'neutral' | 'accent'
}

defineProps<{ modelValue: T; options: TileOption<T>[] }>()
defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="tile-picker" :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="tile-picker__tile"
      :class="[opt.tone ? `tile-picker__tile--${opt.tone}` : '', { 'tile-picker__tile--active': modelValue === opt.value }]"
      @click="$emit('update:modelValue', opt.value)"
    >
      <IonIcon v-if="opt.icon" :icon="opt.icon" aria-hidden="true" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.tile-picker {
  display: grid;
  gap: 8px;
}

.tile-picker__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 10px 4px;
  border-radius: var(--vita-radius-sm);
  border: 2px solid transparent;
  background: var(--ion-color-light, #f4f4f4);
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;
}

.tile-picker__tile:active {
  transform: scale(0.96);
}

.tile-picker__tile ion-icon {
  font-size: 1.3rem;
}

.tile-picker__tile span {
  font-size: 0.78rem;
  text-align: center;
  overflow-wrap: anywhere;
}

.tile-picker__tile--good.tile-picker__tile--active {
  border-color: var(--ion-color-success);
  color: var(--ion-color-success-shade, var(--ion-color-success));
  background: color-mix(in srgb, var(--ion-color-success) 14%, transparent);
}

.tile-picker__tile--bad.tile-picker__tile--active {
  border-color: var(--ion-color-danger);
  color: var(--ion-color-danger-shade, var(--ion-color-danger));
  background: color-mix(in srgb, var(--ion-color-danger) 12%, transparent);
}

.tile-picker__tile--accent.tile-picker__tile--active {
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary-shade, var(--ion-color-primary));
  background: color-mix(in srgb, var(--ion-color-primary) 14%, transparent);
}

.tile-picker__tile--neutral.tile-picker__tile--active {
  border-color: var(--ion-color-medium, #92949c);
  color: var(--ion-color-medium-shade, #7a7d84);
  background: color-mix(in srgb, var(--ion-color-medium, #92949c) 16%, transparent);
}
</style>
