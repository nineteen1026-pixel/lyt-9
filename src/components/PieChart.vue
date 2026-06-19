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
  overBudget?: boolean
  drillable?: boolean
}

const props = defineProps<{
  data: PieDataItem[]
}>()

const emit = defineEmits<{
  legendClick: [name: string]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let isRestoringSelection = false

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
        padding: [0, 0, 0, 8],
        rich: {
          over: {
            color: '#EF4444',
            fontWeight: 'bold'
          },
          drill: {
            color: '#7C3AED',
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      },
      formatter: (name: string) => {
        const item = props.data.find(d => d.name === name)
        if (!item) return name
        const suffix = item.overBudget ? ' (超支)' : ''
        const drill = item.drillable ? ' {drill|›}' : ''
        return item.overBudget 
          ? `{over|${name}${suffix}}${drill}  ¥${item.value.toLocaleString()}`
          : `${name}${suffix}${drill}  ¥${item.value.toLocaleString()}`
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
          borderRadius: 8
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: true,
          lineStyle: {
            color: '#999'
          }
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
            color: item.overBudget ? '#EF4444' : item.color,
            borderColor: item.overBudget ? '#B91C1C' : '#fff',
            borderWidth: item.overBudget ? 3 : 2,
            borderRadius: 8,
            shadowBlur: item.overBudget ? 15 : 0,
            shadowColor: item.overBudget ? 'rgba(239, 68, 68, 0.5)' : 'transparent'
          },
          label: {
            show: true,
            position: 'outside',
            formatter: item.overBudget ? `{over|${item.name}}(超支)\n{d}%` : `${item.name}\n{d}%`,
            color: item.overBudget ? '#EF4444' : '#555',
            fontSize: 12,
            lineHeight: 18,
            fontWeight: item.overBudget ? 'bold' : 'normal',
            rich: {
              over: {
                color: '#EF4444',
                fontWeight: 'bold'
              }
            }
          },
          labelLine: {
            lineStyle: {
              color: item.overBudget ? '#EF4444' : '#999',
              width: item.overBudget ? 2 : 1
            }
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

  chartInstance.on('legendselectchanged', (params: any) => {
    if (isRestoringSelection) return
    const clickedName = params.name
    const clickedItem = props.data.find(d => d.name === clickedName)
    if (clickedItem?.drillable) {
      emit('legendClick', clickedName)
    }
    if (!params.selected[clickedName]) {
      isRestoringSelection = true
      chartInstance?.dispatchAction({
        type: 'legendSelect',
        name: clickedName
      })
      isRestoringSelection = false
    }
  })
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
        legend: {
          formatter: (name: string) => {
            const item = props.data.find(d => d.name === name)
            if (!item) return name
            const suffix = item.overBudget ? ' (超支)' : ''
            const drill = item.drillable ? ' {drill|›}' : ''
            return item.overBudget 
              ? `{over|${name}${suffix}}${drill}  ¥${item.value.toLocaleString()}`
              : `${name}${suffix}${drill}  ¥${item.value.toLocaleString()}`
          }
        },
        series: [
          {
            data: props.data.map(item => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: item.overBudget ? '#EF4444' : item.color,
                borderColor: item.overBudget ? '#B91C1C' : '#fff',
                borderWidth: item.overBudget ? 3 : 2,
                borderRadius: 8,
                shadowBlur: item.overBudget ? 15 : 0,
                shadowColor: item.overBudget ? 'rgba(239, 68, 68, 0.5)' : 'transparent'
              },
              label: {
                show: true,
                position: 'outside',
                formatter: item.overBudget ? `{over|${item.name}}(超支)\n{d}%` : `${item.name}\n{d}%`,
                color: item.overBudget ? '#EF4444' : '#555',
                fontSize: 12,
                lineHeight: 18,
                fontWeight: item.overBudget ? 'bold' : 'normal',
                rich: {
                  over: {
                    color: '#EF4444',
                    fontWeight: 'bold'
                  }
                }
              },
              labelLine: {
                lineStyle: {
                  color: item.overBudget ? '#EF4444' : '#999',
                  width: item.overBudget ? 2 : 1
                }
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
