import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export type PwaUpdateCheckResult = 'update-available' | 'up-to-date' | 'unsupported'

// Registered once at module scope so every caller (the update banner and the
// Settings "check now" action) shares the same service-worker registration
// and the same `needRefresh` state instead of registering the SW twice.
let registration: ServiceWorkerRegistration | undefined

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl, reg) {
    registration = reg
  },
})

const checking = ref(false)

/** Manually checks the network for a new service worker and, if found, applies it. */
export function usePwaUpdate() {
  async function checkForUpdate(): Promise<PwaUpdateCheckResult> {
    if (!registration) return 'unsupported'
    if (needRefresh.value) return 'update-available'

    checking.value = true
    try {
      await registration.update()
      // registration.update() resolves once the new SW script is fetched;
      // installing it and reaching the "waiting" state (which flips
      // needRefresh via onNeedRefresh) happens a beat later.
      await new Promise((resolve) => setTimeout(resolve, 1200))
    } finally {
      checking.value = false
    }
    return needRefresh.value ? 'update-available' : 'up-to-date'
  }

  return {
    needRefresh,
    offlineReady,
    checking,
    checkForUpdate,
    applyUpdate: () => updateServiceWorker(),
  }
}
