import { toastController } from '@ionic/vue'

export function useToast() {
  async function show(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
      color,
    })
    await toast.present()
  }

  return {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'danger'),
  }
}
