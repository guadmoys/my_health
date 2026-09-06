<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useRoute } from 'vue-router'

import { desktopNavItems } from './nav-items'

const route = useRoute()
</script>

<template>
  <IonSplitPane content-id="main-content" when="md">
    <IonMenu content-id="main-content" type="reveal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>VITA</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem
            v-for="item in desktopNavItems"
            :key="item.to"
            :router-link="item.to"
            :color="route.path === item.to ? 'light' : undefined"
            lines="none"
            button
          >
            <IonIcon :icon="item.icon" slot="start" aria-hidden="true" />
            <IonLabel>{{ item.label }}</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
    <IonRouterOutlet id="main-content" />
  </IonSplitPane>
</template>
