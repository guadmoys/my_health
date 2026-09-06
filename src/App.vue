<script setup lang="ts">
import { IonApp } from '@ionic/vue'

import AppShell from '@/components/layout/AppShell.vue'
import PwaUpdatePrompt from '@/components/layout/PwaUpdatePrompt.vue'
</script>

<template>
  <IonApp>
    <AppShell />
    <PwaUpdatePrompt />
  </IonApp>
</template>
