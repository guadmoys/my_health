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
  --background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.82);
  --border: none;
  --color: var(--ion-color-medium, #92949c);
  --color-selected: var(--ion-color-primary, #0a84ff);
  height: 58px;
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  box-shadow:
    0 -1px 0 rgba(0, 0, 0, 0.06),
    0 -16px 28px -18px rgba(0, 0, 0, 0.4);
}

ion-tab-button {
  --padding-top: 0;
  --padding-bottom: 0;
}

ion-tab-button ion-icon {
  font-size: 25px;
}

/* The "+" FAB overlaps the bar rather than sitting inside it, the way the
   center action reads on iOS Telegram/Instagram — a bright, glowing circle
   punched through the bar instead of just another flat tab icon. */
.quick-add-btn {
  position: fixed;
  left: 50%;
  bottom: calc(30px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary, #0a84ff), var(--ion-color-primary-shade, #0973e0));
  color: var(--ion-color-primary-contrast, #fff);
  padding: 0;
  cursor: pointer;
  z-index: 100;
  box-shadow:
    0 0 0 5px var(--ion-background-color, #fff),
    0 8px 20px -4px rgba(var(--ion-color-primary-rgb, 10, 132, 255), 0.55),
    0 0 20px rgba(var(--ion-color-primary-rgb, 10, 132, 255), 0.45);
}

.quick-add-btn ion-icon {
  font-size: 28px;
}

@media (prefers-reduced-motion: no-preference) {
  .quick-add-btn {
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .quick-add-btn:active {
    transform: translateX(-50%) scale(0.9);
  }
}
</style>
