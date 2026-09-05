import { defineStore } from 'pinia'
import { ref } from 'vue'

export type QuickAddAction =
  | 'meal'
  | 'water'
  | 'weight'
  | 'workout'
  | 'sleep'
  | 'activity'
  | 'wellbeing'
  | 'habit'
  | 'note'

export const useUiStore = defineStore('ui', () => {
  const quickAddOpen = ref(false)

  function openQuickAdd() {
    quickAddOpen.value = true
  }

  function closeQuickAdd() {
    quickAddOpen.value = false
  }

  return { quickAddOpen, openQuickAdd, closeQuickAdd }
})
