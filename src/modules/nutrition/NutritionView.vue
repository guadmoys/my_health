<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
import { ref } from 'vue'

import DiaryTab from './DiaryTab.vue'
import FoodsTab from './FoodsTab.vue'
import RecipesTab from './RecipesTab.vue'

const tab = ref<'diary' | 'foods' | 'recipes'>('diary')
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Питание</IonTitle>
      </IonToolbar>
      <IonToolbar>
        <IonSegment v-model="tab">
          <IonSegmentButton value="diary">Дневник</IonSegmentButton>
          <IonSegmentButton value="foods">Продукты</IonSegmentButton>
          <IonSegmentButton value="recipes">Рецепты</IonSegmentButton>
        </IonSegment>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <DiaryTab v-if="tab === 'diary'" />
      <FoodsTab v-else-if="tab === 'foods'" />
      <RecipesTab v-else />
    </IonContent>
  </IonPage>
</template>
