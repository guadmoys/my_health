<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

withDefaults(
  defineProps<{
    avatarText?: string
    avatarIcon?: string
    avatarHue?: number
    accent?: 'good' | 'bad' | 'neutral' | 'accent' | 'none'
    clickable?: boolean
  }>(),
  { accent: 'none', clickable: true },
)

defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    class="entity-card"
    :class="[`entity-card--${accent}`, { 'entity-card--clickable': clickable }]"
    :type="clickable ? 'button' : undefined"
    @click="clickable && $emit('click')"
  >
    <div
      v-if="avatarText || avatarIcon || $slots.avatar"
      class="entity-card__avatar"
      :style="avatarHue !== undefined ? { background: `hsl(${avatarHue} 70% 92%)`, color: `hsl(${avatarHue} 55% 32%)` } : undefined"
    >
      <slot name="avatar">
        <IonIcon v-if="avatarIcon" :icon="avatarIcon" aria-hidden="true" />
        <template v-else>{{ avatarText }}</template>
      </slot>
    </div>

    <div class="entity-card__body">
      <div class="entity-card__top">
        <div class="entity-card__titles">
          <h3 class="entity-card__title"><slot name="title" /></h3>
          <p v-if="$slots.subtitle" class="entity-card__subtitle"><slot name="subtitle" /></p>
        </div>
        <div v-if="$slots.trailing" class="entity-card__trailing"><slot name="trailing" /></div>
      </div>
      <p v-if="$slots.description" class="entity-card__description"><slot name="description" /></p>
      <div v-if="$slots.footer" class="entity-card__footer"><slot name="footer" /></div>
    </div>
  </component>
</template>

<style scoped>
.entity-card {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  padding: 12px;
  border: none;
  border-left: 4px solid var(--ion-color-medium, #92949c);
  border-radius: var(--vita-radius);
  background: var(--vita-surface);
  box-shadow: var(--vita-shadow);
  font: inherit;
  color: inherit;
}

.entity-card--clickable {
  cursor: pointer;
  transition: transform 0.12s ease;
}

.entity-card--clickable:active {
  transform: scale(0.98);
}

.entity-card--good {
  border-left-color: var(--ion-color-success);
}

.entity-card--bad {
  border-left-color: var(--ion-color-danger);
}

.entity-card--accent {
  border-left-color: var(--ion-color-primary);
}

.entity-card--neutral {
  border-left-color: var(--ion-color-medium, #92949c);
}

.entity-card--none {
  border-left-color: transparent;
}

.entity-card__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  background: var(--ion-color-light, #f4f4f4);
}

.entity-card__body {
  flex: 1;
  min-width: 0;
}

.entity-card__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.entity-card__titles {
  min-width: 0;
}

.entity-card__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
}

.entity-card__subtitle {
  margin: 2px 0 0;
  font-size: 0.85rem;
  opacity: 0.65;
}

.entity-card__trailing {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.entity-card__description {
  margin: 6px 0 0;
  font-size: 0.88rem;
  opacity: 0.8;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.entity-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
</style>
