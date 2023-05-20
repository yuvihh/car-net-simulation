<template>
	<e-charts :option="图表选项" class="图表" theme="dark"/>
</template>

<script lang="ts" setup>
import ECharts from "vue-echarts";
import "echarts";
import type { EChartsOption } from "echarts";

const { 信道利用率样本 } = defineProps<{ 信道利用率样本: [number, number][] }>();

const 图表选项: EChartsOption = {
  title: {
    text: "信道利用率"
  },
  xAxis: {
    type: "time",
    axisLabel: {
      formatter: String
    },
    name: "时间 (秒)",
    nameLocation: "middle",
    nameTextStyle: {
      padding: 20
    },
  },
  yAxis: {
    type: "value",
    name: "信道利用率 (%)",
    nameLocation: "middle",
    nameTextStyle: {
      padding: 20
    },
  },
  series: [
    {
      type: "line",
      data: 信道利用率样本,
      showSymbol: false,
      smooth: true
    }
  ],
  animation: false
};
</script>

<style scoped>
.图表 {
    width: 600px;
    height: 300px;
}
</style>