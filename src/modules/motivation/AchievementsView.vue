<script setup lang="ts">
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { ref, watch } from 'vue'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { achievementRepository } from '@/database/repositories'
import type { Achievement } from '@/database/types'

import { describeAchievement } from './achievements'

const achievements = useLiveQuery(() => achievementRepository.getAll(), [] as Achievement[])
const labels = ref<Record<string, string>>({})

watch(
  achievements,
  async (list) => {
    for (const a of list) {
      if (!labels.value[a.key]) labels.value[a.key] = await describeAchievement(a.key)
    }
  },
  { immediate: true },
)
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Достижения</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItem v-for="a in achievements" :key="a.id">
          <IonLabel>
            <h2>{{ labels[a.key] ?? a.key }}</h2>
            <p>{{ a.unlockedAt.slice(0, 10) }}</p>
          </IonLabel>
        </IonItem>
        <IonItem v-if="!achievements.length">
          <IonLabel color="medium">Пока нет достижений — они появятся по мере тренировок и регулярных записей.</IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
</template>
