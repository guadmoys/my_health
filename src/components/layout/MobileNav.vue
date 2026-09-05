<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { useUiStore } from '@/stores/ui.store'

import { mobileNavItems } from './nav-items'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const [left, right] = [mobileNavItems.slice(0, 2), mobileNavItems.slice(2)]
</script>

<template>
  <nav class="mobile-nav" aria-label="Основная навигация">
    <button
      v-for="item in left"
      :key="item.to"
      type="button"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': route.path === item.to }"
      @click="router.push(item.to)"
    >
      <span aria-hidden="true">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>

    <button
      type="button"
      class="mobile-nav__fab"
      aria-label="Добавить"
      @click="ui.openQuickAdd()"
    >
      +
    </button>

    <button
      v-for="item in right"
      :key="item.to"
      type="button"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': route.path === item.to }"
      @click="router.push(item.to)"
    >
      <span aria-hidden="true">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--n-color, #fff);
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  z-index: 100;
}

.mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  padding: 4px 8px;
  font-size: 11px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.mobile-nav__item--active {
  color: var(--n-primary-color, #18a058);
  font-weight: 600;
}

.mobile-nav__fab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-top: -20px;
  border-radius: 50%;
  border: none;
  background: var(--n-primary-color, #18a058);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

@media (prefers-reduced-motion: no-preference) {
  .mobile-nav__item,
  .mobile-nav__fab {
    transition: transform 0.15s ease;
  }

  .mobile-nav__fab:active {
    transform: scale(0.94);
  }
}
</style>
