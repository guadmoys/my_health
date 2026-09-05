import { liveQuery, type Subscription } from 'dexie'
import { onUnmounted, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue'

/**
 * Subscribes a Dexie liveQuery to a Vue ref. Dexie tracks which tables a
 * querier reads and re-runs it whenever any of them changes — anywhere in
 * the app, including writes made from a different component. This is what
 * keeps screens in sync without every repository call needing to know who
 * else might be showing the same data.
 *
 * Dexie's liveQuery has no idea about Vue reactivity, though: if the
 * querier also reads a Vue ref (e.g. a search box), pass it in `deps` so
 * the subscription is torn down and recreated whenever it changes —
 * otherwise typing into that search box would never refresh the results.
 */
export function useLiveQuery<T>(querier: () => T | Promise<T>, initial: T, deps: WatchSource[] = []): Ref<T> {
  const state = (typeof initial === 'object' && initial !== null ? shallowRef(initial) : ref(initial)) as Ref<T>
  let subscription: Subscription | undefined

  function subscribe() {
    subscription?.unsubscribe()
    subscription = liveQuery(querier).subscribe({
      next: (value) => {
        state.value = value
      },
      error: (err) => {
        console.error('useLiveQuery error:', err)
      },
    })
  }

  subscribe()
  if (deps.length) {
    watch(deps, subscribe)
  }

  onUnmounted(() => subscription?.unsubscribe())

  return state
}
