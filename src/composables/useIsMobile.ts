import { onBeforeUnmount, ref } from 'vue'

const MOBILE_BREAKPOINT_PX = 768

export function useIsMobile() {
  const query = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`
  // Computed synchronously so the correct shell (desktop vs mobile) renders
  // on first paint — waiting for onMounted would briefly mount the wrong
  // one and tear it down a tick later (Ionic's IonMenu logs a console
  // error if it's ever unmounted before its drag listeners attach).
  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia(query) : undefined
  const isMobile = ref(mediaQuery?.matches ?? false)

  const update = () => {
    isMobile.value = mediaQuery?.matches ?? false
  }

  mediaQuery?.addEventListener('change', update)
  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return { isMobile }
}
