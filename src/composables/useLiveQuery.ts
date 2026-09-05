import { liveQuery } from 'dexie'
import { onUnmounted, ref, shallowRef, type Ref } from 'vue'

/**
 * Subscribes a Dexie liveQuery to a Vue ref. Dexie tracks which tables a
 * querier reads and re-runs it whenever any of them changes — anywhere in
 * the app, including writes made from a different component. This is what
 * keeps screens in sync without every repository call needing to know who
 * else might be showing the same data.
 */
export function useLiveQuery<T>(querier: () => T | Promise<T>, initial: T): Ref<T> {
  const state = (typeof initial === 'object' && initial !== null ? shallowRef(initial) : ref(initial)) as Ref<T>

  const subscription = liveQuery(querier).subscribe({
    next: (value) => {
      state.value = value
    },
    error: (err) => {
      console.error('useLiveQuery error:', err)
    },
  })

  onUnmounted(() => subscription.unsubscribe())

  return state
}
