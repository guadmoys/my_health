<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue'
import { cloudUploadOutline, personCircleOutline } from 'ionicons/icons'
import { reactive, ref, watch } from 'vue'

import { CardTitle } from '@/components/ui'

import { useLiveQuery } from '@/composables/useLiveQuery'
import { useToast } from '@/composables/useToast'
import { createBackup, restoreBackup } from '@/database/backup'
import { profileRepository } from '@/database/repositories'
import type { Profile } from '@/database/types'
import { today } from '@/utils/date'

import { profileFormSchema } from './schemas'

const toast = useToast()

const profile = useLiveQuery(() => profileRepository.getCurrent(), undefined as Profile | undefined)

const form = reactive({
  name: '',
  sex: 'unspecified' as Profile['sex'],
  heightCm: '' as string | number,
  units: 'metric' as Profile['units'],
  nutritionDisplayMode: 'full' as Profile['nutritionDisplayMode'],
  weekStartsOn: 1 as Profile['weekStartsOn'],
})
let formInitialized = false
watch(
  profile,
  (p) => {
    if (formInitialized || !p) return
    form.name = p.name ?? ''
    form.sex = p.sex ?? 'unspecified'
    form.heightCm = p.heightCm ?? ''
    form.units = p.units
    form.nutritionDisplayMode = p.nutritionDisplayMode
    form.weekStartsOn = p.weekStartsOn
    formInitialized = true
  },
  { immediate: true },
)

const errors = ref<string[]>([])

async function saveProfile() {
  if (!profile.value) return
  const result = profileFormSchema.safeParse({
    name: form.name || undefined,
    sex: form.sex,
    heightCm: form.heightCm === '' ? undefined : Number(form.heightCm),
    units: form.units,
    nutritionDisplayMode: form.nutritionDisplayMode,
    weekStartsOn: form.weekStartsOn,
  })
  if (!result.success) {
    errors.value = result.error.issues.map((i) => i.message)
    return
  }
  errors.value = []
  await profileRepository.update(profile.value.id, { ...result.data, updatedAt: new Date().toISOString() })
  await toast.success('Сохранено')
}

// --- Backup / restore (§ backup-import): the whole local DB as one JSON file ---
async function exportBackup() {
  const backup = await createBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vita-backup-${today()}.json`
  a.click()
  URL.revokeObjectURL(url)
  await toast.success('Резервная копия сохранена')
}

const fileInput = ref<HTMLInputElement>()
function pickImportFile() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    await toast.error('Не удалось прочитать файл — это не JSON.')
    return
  }

  const alert = await alertController.create({
    header: 'Восстановить из резервной копии?',
    message: 'Все текущие данные в приложении будут заменены содержимым файла. Это действие необратимо.',
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      {
        text: 'Восстановить',
        role: 'destructive',
        handler: () => {
          void (async () => {
            try {
              await restoreBackup(parsed as never)
              await toast.success('Данные восстановлены')
              location.reload()
            } catch {
              await toast.error('Файл повреждён или не является резервной копией VITA.')
            }
          })()
        },
      },
    ],
  })
  await alert.present()
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Настройки</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="ion-padding">
      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="personCircleOutline">Профиль</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p v-for="err in errors" :key="err" class="error">{{ err }}</p>
          <IonList>
            <IonItem>
              <IonInput v-model="form.name" label="Имя" label-placement="stacked" placeholder="Необязательно" />
            </IonItem>
            <IonItem>
              <IonSelect v-model="form.sex" label="Пол" label-placement="stacked">
                <IonSelectOption value="unspecified">Не указан</IonSelectOption>
                <IonSelectOption value="female">Женский</IonSelectOption>
                <IonSelectOption value="male">Мужской</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput v-model="form.heightCm" type="number" label="Рост, см" label-placement="stacked" placeholder="Необязательно" />
            </IonItem>
            <IonItem>
              <IonSelect v-model="form.units" label="Единицы измерения" label-placement="stacked">
                <IonSelectOption value="metric">Метрические (кг, см)</IonSelectOption>
                <IonSelectOption value="imperial">Имперские (фунты, футы)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect v-model="form.nutritionDisplayMode" label="Отображение питания" label-placement="stacked">
                <IonSelectOption value="full">Полное (калории и БЖУ)</IonSelectOption>
                <IonSelectOption value="simplified">Упрощённое</IonSelectOption>
                <IonSelectOption value="hidden">Скрыто</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect v-model="form.weekStartsOn" label="Начало недели" label-placement="stacked">
                <IonSelectOption :value="1">Понедельник</IonSelectOption>
                <IonSelectOption :value="0">Воскресенье</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
          <IonButton expand="block" @click="saveProfile">Сохранить</IonButton>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <CardTitle :icon="cloudUploadOutline">Резервная копия</CardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Все данные хранятся только на этом устройстве. Сохраните резервную копию, чтобы не потерять их.</p>
          <IonButton expand="block" @click="exportBackup">Экспортировать данные</IonButton>
          <IonButton expand="block" fill="outline" @click="pickImportFile">Импортировать данные</IonButton>
          <input ref="fileInput" type="file" accept="application/json" hidden @change="onFileSelected" />
        </IonCardContent>
      </IonCard>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.error {
  color: var(--ion-color-danger);
}
</style>
