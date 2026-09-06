<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ seconds: number }>()
const emit = defineEmits<{ done: [] }>()

const remaining = ref(props.seconds)
let interval: ReturnType<typeof setInterval> | undefined

function stop() {
  if (interval) clearInterval(interval)
  interval = undefined
}

function start() {
  stop()
  remaining.value = props.seconds
  interval = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      stop()
      emit('done')
    }
  }, 1000)
}

function adjust(delta: number) {
  remaining.value = Math.max(0, remaining.value + delta)
}

function skip() {
  stop()
  emit('done')
}

watch(() => props.seconds, start, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <div class="rest-timer">
    <p class="rest-timer__label">Отдых: {{ remaining }} с</p>
    <div class="rest-timer__actions">
      <IonButton size="small" fill="outline" @click="adjust(-15)">-15с</IonButton>
      <IonButton size="small" fill="outline" @click="adjust(15)">+15с</IonButton>
      <IonButton size="small" @click="skip">Пропустить</IonButton>
    </div>
  </div>
</template>

<style scoped>
.rest-timer {
  padding: 16px;
  border-radius: 12px;
  background: var(--ion-color-light);
  text-align: center;
  margin: 12px 0;
}

.rest-timer__label {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 12px;
}

.rest-timer__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
