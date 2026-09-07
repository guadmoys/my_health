<script setup lang="ts">
export interface Stat {
  value: string | number
  label: string
  tone?: 'good' | 'bad' | 'neutral' | 'accent'
}

defineProps<{ stats: Stat[] }>()
</script>

<template>
  <div class="stat-bar">
    <div v-for="(stat, i) in stats" :key="i" class="stat-bar__item" :class="stat.tone ? `stat-bar__item--${stat.tone}` : ''">
      <span class="stat-bar__value">{{ stat.value }}</span>
      <span class="stat-bar__label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-bar {
  display: flex;
  gap: 10px;
}

.stat-bar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  border-radius: var(--vita-radius-sm);
  background: var(--ion-color-light, #f4f4f4);
}

.stat-bar__item--good {
  background: color-mix(in srgb, var(--ion-color-success) 14%, transparent);
}

.stat-bar__item--bad {
  background: color-mix(in srgb, var(--ion-color-danger) 12%, transparent);
}

.stat-bar__item--accent {
  background: color-mix(in srgb, var(--ion-color-primary) 12%, transparent);
}

.stat-bar__value {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.1;
}

.stat-bar__label {
  font-size: 0.72rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}
</style>
