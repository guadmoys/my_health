<script setup lang="ts">
import { IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { useRoute, useRouter } from 'vue-router'

import { mobileNavItems } from './nav-items'
import { presentQuickAdd } from './quick-add'

const route = useRoute()
const router = useRouter()

const [left, right] = [mobileNavItems.slice(0, 2), mobileNavItems.slice(2)]
</script>

<template>
  <IonTabs>
    <IonRouterOutlet />
    <IonTabBar slot="bottom">
      <IonTabButton
        v-for="item in left"
        :key="item.to"
        :tab="item.to"
        :href="item.to"
        :aria-label="item.label"
      >
        <IonIcon :icon="route.path === item.to ? item.activeIcon : item.icon" aria-hidden="true" />
      </IonTabButton>

      <!-- Spacer for the "+" button rendered below, kept out of Ionic's own tap/ripple handling. -->
      <IonTabButton tab="quick-add" disabled />

      <IonTabButton
        v-for="item in right"
        :key="item.to"
        :tab="item.to"
        :href="item.to"
        :aria-label="item.label"
      >
        <IonIcon :icon="route.path === item.to ? item.activeIcon : item.icon" aria-hidden="true" />
      </IonTabButton>
    </IonTabBar>
  </IonTabs>

  <button type="button" class="quick-add-btn" aria-label="Добавить" @click="presentQuickAdd(router)">
    <IonIcon :icon="addOutline" aria-hidden="true" />
  </button>
</template>

<style scoped>
ion-tab-bar {
  --background: var(--ion-background-color, #fff);
  --border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.12));
  --color: var(--ion-color-step-600, #737373);
  --color-selected: var(--ion-text-color, #000);
  height: 50px;
  padding-bottom: env(safe-area-inset-bottom);
}

ion-tab-button {
  --padding-top: 0;
  --padding-bottom: 0;
}

ion-tab-button ion-icon {
  font-size: 26px;
}

.quick-add-btn {
  position: fixed;
  left: 50%;
  bottom: calc(10px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1.5px solid var(--ion-text-color, #000);
  border-radius: 8px;
  background: transparent;
  color: var(--ion-text-color, #000);
  padding: 0;
  cursor: pointer;
  z-index: 100;
}

.quick-add-btn ion-icon {
  font-size: 20px;
}

@media (prefers-reduced-motion: no-preference) {
  .quick-add-btn {
    transition: transform 0.1s ease;
  }

  .quick-add-btn:active {
    transform: translateX(-50%) scale(0.92);
  }
}
</style>
