<template>
	<e-charts :option="图表选项" class="图表" theme="dark"/>
</template>

<script setup lang="ts">
import ECharts from "vue-echarts";
import "echarts";
import type { EChartsOption } from "echarts";
import { inject, reactive } from "vue";
import { SPMA网卡类 } from "@/网络模型/spma";
import { 生成初始化样本 } from "@/控制面板组件/移动单位/网卡/SPMA网卡/生成初始化样本";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { 获取SPMA网卡平均退避时延 } from "@/控制面板组件/移动单位/网卡/SPMA网卡/退避时延图表/SPMA退避时延统计";

const 初始化样本 = 生成初始化样本();
const 退避时延样本 = reactive(初始化样本);
const SPMA网卡 = inject<SPMA网卡类>("SPMA网卡")!;

function 更新退避时延样本(): void {
  const 当前时间 = 离散事件仿真器.当前时间;
  const 退避时延 = 获取SPMA网卡平均退避时延(SPMA网卡);
  const 退避时延采样数据: [number, number] = [当前时间, 退避时延];
  退避时延样本.push(退避时延采样数据);
  退避时延样本.shift();
}

async function 持续采样退避时延(): Promise<void> {
  while (true) {
    更新退避时延样本();
    await new Promise<void>(resolve => 离散事件仿真器.添加事件(0.1, resolve));
  }
}

持续采样退避时延().then();

const 图表选项: EChartsOption = {
  title: {
    text: "退避时延"
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
    name: "平均退避时延 (s)",
    nameLocation: "middle",
    nameTextStyle: {
      padding: 20
    },
  },
  series: [
    {
      type: "line",
      data: 退避时延样本,
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