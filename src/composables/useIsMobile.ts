import { onBeforeUnmount, onMounted, ref } from 'vue'

const MOBILE_BREAKPOINT_PX = 768

export function useIsMobile() {
  const isMobile = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const update = () => {
    isMobile.value = mediaQuery?.matches ?? false
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`)
    update()
    mediaQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return { isMobile }
}
