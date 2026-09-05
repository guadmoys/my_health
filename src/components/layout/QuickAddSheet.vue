<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

import { waterRepository } from '@/database/repositories'
import { useUiStore } from '@/stores/ui.store'
import { today } from '@/utils/date'
import { createId } from '@/utils/id'

const ui = useUiStore()
const router = useRouter()
const message = useMessage()

interface QuickAction {
  label: string
  icon: string
  run: () => void | Promise<void>
}

const actions: QuickAction[] = [
  { label: 'Приём пищи', icon: '🍽️', run: () => go('/nutrition') },
  {
    label: 'Вода',
    icon: '💧',
    run: async () => {
      await waterRepository.add({ id: createId(), date: today(), amountMl: 250, createdAt: new Date().toISOString() })
      message.success('Записано: 250 мл воды')
    },
  },
  { label: 'Вес', icon: '⚖️', run: () => go('/progress') },
  { label: 'Тренировка', icon: '🏋️', run: () => go('/workouts') },
  { label: 'Сон', icon: '🌙', run: () => go('/progress') },
  { label: 'Активность', icon: '🚶', run: () => go('/progress') },
  { label: 'Самочувствие', icon: '🙂', run: () => go('/') },
  { label: 'Привычка', icon: '✅', run: () => go('/habits') },
  { label: 'Заметка', icon: '📝', run: () => go('/calendar') },
]

function go(path: string) {
  router.push(path)
}

async function handleAction(action: QuickAction) {
  await action.run()
  ui.closeQuickAdd()
}
</script>

<template>
  <n-drawer
    :show="ui.quickAddOpen"
    placement="bottom"
    :height="420"
    @update:show="(v: boolean) => (v ? ui.openQuickAdd() : ui.closeQuickAdd())"
  >
    <n-drawer-content title="Добавить" closable body-content-style="padding-bottom: 24px">
      <div class="quick-add-grid">
        <button
          v-for="action in actions"
          :key="action.label"
          type="button"
          class="quick-add-grid__item"
          @click="handleAction(action)"
        >
          <span aria-hidden="true" class="quick-add-grid__icon">{{ action.icon }}</span>
          <span>{{ action.label }}</span>
        </button>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.quick-add-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-add-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 16px 8px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: none;
  color: inherit;
  cursor: pointer;
}

.quick-add-grid__icon {
  font-size: 22px;
}
</style>
