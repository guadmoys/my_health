<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue'
import dayjs from 'dayjs'
import { ref, watch } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { habitRepository } from '@/database/repositories'
import type { Habit, HabitLog } from '@/database/types'
import { DATE_FORMAT, nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'

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

function mondayStartOfWeek(): string {
  const dow = dayjs().day() // 0 = Sunday
  const diffFromMonday = dow === 0 ? 6 : dow - 1
  return dayjs().subtract(diffFromMonday, 'day').format(DATE_FORMAT)
}

/** Framed positively, never as a penalty for missed days (§21). */
function progressText(habit: Habit): string {
  const logs = logsByHabit.value[habit.id] ?? []
  if (habit.schedule === 'daily') {
    const last7Start = dayjs().subtract(6, 'day').format(DATE_FORMAT)
    const count = logs.filter((l) => l.completed && l.date >= last7Start).length
    return `${count} активных дней из 7`
  }
  const weekStart = mondayStartOfWeek()
  const count = logs.filter((l) => l.completed && l.date >= weekStart).length
  return `${count} из ${habit.targetPerPeriod} на этой неделе`
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
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Привычки</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItemSliding v-for="habit in habits" :key="habit.id">
          <IonItem>
            <IonCheckbox slot="start" :checked="isDoneToday(habit)" @ion-change="toggle(habit)" />
            <IonLabel>
              <h2>{{ habit.name }}</h2>
              <p>{{ progressText(habit) }}</p>
            </IonLabel>
          </IonItem>
          <IonItemOptions side="end">
            <IonItemOption color="medium" @click="archiveHabit(habit)">Архив</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>

        <IonItem v-if="!habits.length">
          <IonLabel color="medium">Привычек пока нет. Создайте первую кнопкой ниже.</IonLabel>
        </IonItem>
      </IonList>

      <div class="ion-padding">
        <IonButton expand="block" @click="openCreateForm">+ Новая привычка</IonButton>
      </div>
    </IonContent>
  </IonPage>
</template>
