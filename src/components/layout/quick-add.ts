import { actionSheetController } from '@ionic/vue'
import type { Router } from 'vue-router'

import { useToast } from '@/composables/useToast'
import { waterRepository } from '@/database/repositories'
import { nowIso, today } from '@/utils/date'
import { createId } from '@/utils/id'

/**
 * The "+" quick action (§6.1). Most actions just navigate to the relevant
 * section — those screens aren't built yet, so this is a fast launcher.
 * Water is wired end-to-end here since it's a trivial one-tap write.
 */
export async function presentQuickAdd(router: Router): Promise<void> {
  const toast = useToast()

  const sheet = await actionSheetController.create({
    header: 'Добавить',
    buttons: [
      { text: 'Приём пищи', handler: () => router.push('/nutrition') },
      {
        text: 'Вода (+250 мл)',
        handler: () => {
          void (async () => {
            await waterRepository.add({ id: createId(), date: today(), amountMl: 250, createdAt: nowIso() })
            await toast.success('Записано: 250 мл воды')
          })()
        },
      },
      { text: 'Вес', handler: () => router.push('/progress') },
      { text: 'Тренировка', handler: () => router.push('/workouts') },
      { text: 'Сон', handler: () => router.push('/progress') },
      { text: 'Активность', handler: () => router.push('/progress') },
      { text: 'Самочувствие', handler: () => router.push('/') },
      { text: 'Привычка', handler: () => router.push('/habits') },
      { text: 'Заметка', handler: () => router.push('/calendar') },
      { text: 'Отмена', role: 'cancel' },
    ],
  })
  await sheet.present()
}
