<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const links = [
  { label: 'Тренировки', to: '/workouts' },
  { label: 'Календарь', to: '/calendar' },
  { label: 'Привычки', to: '/habits' },
  { label: 'Аналитика', to: '/analytics' },
  { label: 'Настройки', to: '/settings' },
]
</script>

<template>
  <n-flex vertical style="padding: 16px" :size="8">
    <n-h2 style="margin: 0 0 8px">Ещё</n-h2>
    <n-list hoverable clickable>
      <n-list-item v-for="link in links" :key="link.to" @click="router.push(link.to)">
        {{ link.label }}
      </n-list-item>
    </n-list>
  </n-flex>
</template>
