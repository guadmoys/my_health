<script setup lang="ts">
import { computed, h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'

import { desktopNavItems } from './nav-items'

const route = useRoute()

const menuOptions = computed<MenuOption[]>(() =>
  desktopNavItems.map((item) => ({
    label: () => h(RouterLink, { to: item.to }, { default: () => item.label }),
    key: item.to,
    icon: () => h('span', { 'aria-hidden': 'true' }, item.icon),
  })),
)

const activeKey = computed(() => route.path)
</script>

<template>
  <n-layout-sider bordered width="220" :native-scrollbar="false" show-trigger="bar">
    <div style="padding: 16px 16px 0" aria-hidden="true">
      <n-h3 style="margin: 0">VITA</n-h3>
    </div>
    <n-menu :value="activeKey" :options="menuOptions" />
  </n-layout-sider>
</template>
