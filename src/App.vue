<script setup lang="ts">
import { darkTheme, NConfigProvider, NDialogProvider, NLoadingBarProvider, NMessageProvider } from 'naive-ui'
import { computed } from 'vue'

import AppShell from '@/components/layout/AppShell.vue'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = computed(() => (prefersDark ? darkTheme : null))
</script>

<template>
  <NConfigProvider :theme="theme" style="height: 100%">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <AppShell />
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
