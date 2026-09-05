import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, watch, type Ref } from 'vue'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

/**
 * Thin wrapper so chart components don't each repeat init/resize/dispose/update
 * boilerplate. `el` is watched rather than read once in onMounted: the target
 * div is typically behind a `v-if` on data that loads asynchronously, so it
 * may not exist yet when this composable's owner component first mounts.
 */
export function useEChart(el: Ref<HTMLElement | undefined>, options: Ref<echarts.EChartsCoreOption>) {
  let chart: echarts.ECharts | undefined

  function resize() {
    chart?.resize()
  }

  watch(
    el,
    (element) => {
      if (!element) return
      if (chart) chart.dispose()
      chart = echarts.init(element)
      chart.setOption(options.value)
    },
    { immediate: true },
  )

  watch(options, (opts) => {
    chart?.setOption(opts, true)
  })

  window.addEventListener('resize', resize)
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chart?.dispose()
  })
}
