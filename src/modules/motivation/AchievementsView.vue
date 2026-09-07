<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'

import { Badge, EmptyState, EntityCard } from '@/components/ui'
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

/** Labels are "<emoji> <title>" — split so the emoji becomes the card's avatar. */
function splitLabel(label: string): { emoji: string; title: string } {
  const match = label.match(/^(\S+)\s+(.*)$/)
  return match ? { emoji: match[1], title: match[2] } : { emoji: '🏅', title: label }
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Достижения</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="wrap">
        <div v-if="achievements.length" class="grid">
          <EntityCard v-for="a in achievements" :key="a.id" accent="accent" :clickable="false">
            <template #avatar>{{ splitLabel(labels[a.key] ?? a.key).emoji }}</template>
            <template #title>{{ splitLabel(labels[a.key] ?? a.key).title }}</template>
            <template #footer>
              <Badge tone="accent">{{ a.unlockedAt.slice(0, 10) }}</Badge>
            </template>
          </EntityCard>
        </div>

        <EmptyState
          v-else
          :icon="trophyOutline"
          title="Пока нет достижений"
          note="Они появятся по мере тренировок и регулярных записей."
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 16px 24px;
}

.grid {
  display: grid;
  gap: 10px;
}

.grid :deep(.entity-card__avatar) {
  background: color-mix(in srgb, var(--ion-color-primary) 12%, transparent);
  font-size: 1.3rem;
}
</style>
