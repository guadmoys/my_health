<script setup lang="ts">
import { useIsMobile } from '@/composables/useIsMobile'

import DesktopNav from './DesktopNav.vue'
import MobileNav from './MobileNav.vue'
import QuickAddSheet from './QuickAddSheet.vue'

const { isMobile } = useIsMobile()
</script>

<template>
  <n-layout has-sider position="absolute" style="height: 100%">
    <DesktopNav v-if="!isMobile" />
    <n-layout>
      <n-layout-content :native-scrollbar="false" :content-style="{ padding: '16px', paddingBottom: isMobile ? '80px' : '16px' }">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
  <MobileNav v-if="isMobile" />
  <QuickAddSheet />
</template>
