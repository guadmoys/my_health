<script setup lang="ts">
import { useIsMobile } from '@/composables/useIsMobile'

import DesktopNav from './DesktopNav.vue'
import MobileNav from './MobileNav.vue'

const { isMobile } = useIsMobile()
</script>

<template>
  <MobileNav v-if="isMobile" />
  <DesktopNav v-else />
</template>
