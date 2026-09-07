<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'

withDefaults(defineProps<{ icon?: string }>(), { icon: addOutline })
defineEmits<{ click: [] }>()
</script>

<template>
  <IonButton class="fab-button" shape="round" @click="$emit('click')">
    <IonIcon :icon="icon" slot="start" aria-hidden="true" />
    <slot />
  </IonButton>
</template>

<style scoped>
.fab-button {
  position: fixed;
  right: 20px;
  bottom: max(20px, env(safe-area-inset-bottom));
  --border-radius: 999px;
  --box-shadow: 0 4px 14px rgba(20, 20, 43, 0.22);
  z-index: 10;
}
</style>
