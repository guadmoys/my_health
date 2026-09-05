<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string }>(), {
  description: 'Этот раздел ещё не реализован.',
})
</script>

<template>
  <n-flex vertical align="center" justify="center" style="height: 100%; padding: 48px 16px" :size="8">
    <n-h2 style="margin: 0">{{ title }}</n-h2>
    <n-text depth="3">{{ description }}</n-text>
  </n-flex>
</template>
