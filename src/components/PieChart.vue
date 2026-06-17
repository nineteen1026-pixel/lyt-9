<template>
  <div ref="chartRef" class="w-full h-full min-h-[300px] animate-fade-in"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface PieDataItem {
  name: string
  value: number
  color: string
}

const props = defineProps<{
  data: PieDataItem[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#333',
        fontSize: 14
      },
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);'
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      itemGap: 16,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#666',
        fontSize: 13,
        padding: [0, 0, 0, 8]
      },
      formatter: (name: string) => {
        const item = props.data.find(d => d.name === name)
        return item ? `${name}  ¥${item.value.toLocaleString()}` : name
      }
    },
    series: [
      {
        name: '预算分布',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['35%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#555',
          fontSize: 12,
          lineHeight: 18
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: true
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          scale: true,
          scaleSize: 10
        },
        data: props.data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color
          }
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 100,
        animationDuration: 1500
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(
  () => props.data,
  () => {
    if (chartInstance) {
      chartInstance.setOption({
        series: [
          {
            data: props.data.map(item => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: item.color
              }
            }))
          }
        ]
      })
    }
  },
  { deep: true }
)
</script>
