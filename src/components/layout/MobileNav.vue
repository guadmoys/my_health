<script setup lang="ts">
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import { mobileNavItems } from './nav-items'
import { presentQuickAdd } from './quick-add'

const router = useRouter()

const [left, right] = [mobileNavItems.slice(0, 2), mobileNavItems.slice(2)]
</script>

<template>
  <IonTabs>
    <IonRouterOutlet />
    <IonTabBar slot="bottom">
      <IonTabButton v-for="item in left" :key="item.to" :tab="item.to" :href="item.to">
        <IonIcon :icon="item.icon" aria-hidden="true" />
        <IonLabel>{{ item.label }}</IonLabel>
      </IonTabButton>

      <IonTabButton tab="quick-add" disabled>
        <!-- Spacer under the floating "+" button below. -->
      </IonTabButton>

      <IonTabButton v-for="item in right" :key="item.to" :tab="item.to" :href="item.to">
        <IonIcon :icon="item.icon" aria-hidden="true" />
        <IonLabel>{{ item.label }}</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>

  <button type="button" class="quick-add-fab" aria-label="Добавить" @click="presentQuickAdd(router)">
    <IonIcon :icon="addOutline" aria-hidden="true" />
  </button>
</template>

<style scoped>
.quick-add-fab {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--ion-color-primary, #3880ff);
  color: #fff;
  font-size: 26px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  z-index: 100;
}

@media (prefers-reduced-motion: no-preference) {
  .quick-add-fab {
    transition: transform 0.15s ease;
  }

  .quick-add-fab:active {
    transform: translateX(-50%) scale(0.94);
  }
}
</style>
