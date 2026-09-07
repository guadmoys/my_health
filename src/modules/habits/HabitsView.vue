<script setup lang="ts">
import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, actionSheetController, modalController } from '@ionic/vue'
import dayjs from 'dayjs'
import { checkmark, checkmarkCircleOutline, ellipsisHorizontal } from 'ionicons/icons'
import { ref, watch } from 'vue'

import { EmptyState, EntityCard, FabButton } from '@/components/ui'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { habitRepository } from '@/database/repositories'
import type { Habit, HabitLog } from '@/database/types'
import { DATE_FORMAT, nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'
import { currentWeekRange } from '@/utils/period'

import HabitFormModal from './components/HabitFormModal.vue'

const habits = useLiveQuery(() => habitRepository.getActive(), [] as Habit[])

// 14 days back covers both the rolling 7-day streak (daily habits) and the
// current Monday-start week (weekly habits) without two separate queries.
const rangeStart = dayjs().subtract(13, 'day').format(DATE_FORMAT)
const logsByHabit = ref<Record<string, HabitLog[]>>({})
watch(
  habits,
  async (list) => {
    const result: Record<string, HabitLog[]> = {}
    for (const habit of list) {
      result[habit.id] = await habitRepository.getLogsForRange(habit.id, rangeStart, today())
    }
    logsByHabit.value = result
  },
  { immediate: true },
)

function isDoneToday(habit: Habit): boolean {
  return logsByHabit.value[habit.id]?.some((l) => l.date === today() && l.completed) ?? false
}

async function toggle(habit: Habit) {
  await habitRepository.setForDate(habit.id, today(), !isDoneToday(habit))
  logsByHabit.value[habit.id] = await habitRepository.getLogsForRange(habit.id, rangeStart, today())
}

function progress(habit: Habit): { count: number; target: number } {
  const logs = logsByHabit.value[habit.id] ?? []
  if (habit.schedule === 'daily') {
    const last7Start = dayjs().subtract(6, 'day').format(DATE_FORMAT)
    return { count: logs.filter((l) => l.completed && l.date >= last7Start).length, target: 7 }
  }
  const { from: weekStart } = currentWeekRange()
  return { count: logs.filter((l) => l.completed && l.date >= weekStart).length, target: habit.targetPerPeriod }
}

/** Framed positively, never as a penalty for missed days (§21). */
function progressText(habit: Habit): string {
  const { count, target } = progress(habit)
  return habit.schedule === 'daily' ? `${count} активных дней из ${target}` : `${count} из ${target} на этой неделе`
}

async function openCreateForm() {
  const modal = await modalController.create({ component: HabitFormModal })
  await modal.present()
  const { data, role } = await modal.onDidDismiss<{ name: string; schedule: Habit['schedule']; targetPerPeriod: number }>()
  if (role !== 'confirm' || !data) return

  await habitRepository.add({
    id: createId(),
    ...data,
    active: true,
    createdAt: nowIso(),
  })
}

async function archiveHabit(habit: Habit) {
  await habitRepository.archive(habit.id)
}

async function openActions(habit: Habit) {
  const sheet = await actionSheetController.create({
    header: habit.name,
    buttons: [
      { text: 'В архив', handler: () => archiveHabit(habit) },
      { text: 'Отмена', role: 'cancel' },
    ],
  })
  await sheet.present()
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Привычки</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="wrap">
        <div v-if="habits.length" class="grid">
          <EntityCard
            v-for="habit in habits"
            :key="habit.id"
            :accent="isDoneToday(habit) ? 'good' : 'none'"
            :clickable="false"
          >
            <template #avatar>
              <button
                type="button"
                class="toggle"
                :class="{ 'toggle--done': isDoneToday(habit) }"
                :aria-pressed="isDoneToday(habit)"
                :aria-label="isDoneToday(habit) ? 'Отметить как не выполнено' : 'Отметить как выполнено сегодня'"
                @click="toggle(habit)"
              >
                <IonIcon v-if="isDoneToday(habit)" :icon="checkmark" aria-hidden="true" />
              </button>
            </template>
            <template #title>{{ habit.name }}</template>
            <template #trailing>
              <button type="button" class="icon-btn" aria-label="Действия" @click="openActions(habit)">
                <IonIcon :icon="ellipsisHorizontal" aria-hidden="true" />
              </button>
            </template>
            <template #footer>
              <div class="progress">
                <span class="progress-text">{{ progressText(habit) }}</span>
                <span class="progress-track">
                  <span
                    class="progress-fill"
                    :style="{ width: `${Math.min(100, (progress(habit).count / progress(habit).target) * 100)}%` }"
                  />
                </span>
              </div>
            </template>
          </EntityCard>
        </div>

        <EmptyState
          v-else
          :icon="checkmarkCircleOutline"
          title="Привычек пока нет"
          note="Создайте первую кнопкой ниже — и отмечайте выполнение одним касанием."
        />
      </div>

      <FabButton @click="openCreateForm">Новая привычка</FabButton>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 16px 96px;
}

.grid {
  display: grid;
  gap: 10px;
}

.toggle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--ion-color-medium, #92949c);
  background: transparent;
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}

.toggle:active {
  transform: scale(0.9);
}

.toggle ion-icon {
  font-size: 1.1rem;
}

.toggle--done {
  border-color: var(--ion-color-success);
  background: var(--ion-color-success);
  color: #fff;
}

.icon-btn {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  padding: 4px;
  cursor: pointer;
  display: flex;
}

.progress {
  width: 100%;
}

.progress-text {
  display: block;
  margin-bottom: 6px;
  font-size: 0.88rem;
  opacity: 0.8;
}

.progress-track {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: var(--ion-color-light, #f0f0f0);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--ion-color-success);
  transition: width 0.2s ease;
}
</style>
