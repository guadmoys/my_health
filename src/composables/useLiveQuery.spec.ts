import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { db } from '@/database/db'

import { useLiveQuery } from './useLiveQuery'

describe('useLiveQuery', () => {
  beforeEach(async () => {
    await db.open()
    await db.notes.clear()
  })

  it('re-runs when a table it reads changes', async () => {
    const Host = defineComponent({
      setup() {
        const count = useLiveQuery(() => db.notes.count(), 0)
        return () => h('div', String(count.value))
      },
    })
    const wrapper = mount(Host)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(wrapper.text()).toBe('0')

    await db.notes.add({ id: 'n1', date: '2026-01-01', text: 'hi', createdAt: '' })
    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('1')

    wrapper.unmount()
  })

  it('re-runs when a passed-in Vue dependency changes, even with no DB write', async () => {
    const Host = defineComponent({
      setup() {
        const filter = ref('a')
        const result = useLiveQuery(() => Promise.resolve(filter.value.toUpperCase()), '', [filter])
        return { filter, result }
      },
      render() {
        return h('div', this.result)
      },
    })
    const wrapper = mount(Host)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(wrapper.text()).toBe('A')

    await wrapper.setData({ filter: 'b' })
    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('B')

    wrapper.unmount()
  })
})
