<template>
	<channel-load-chart :信道负载样本="信道负载样本"/>
	<channel-utilization-chart :信道利用率样本="信道利用率样本"/>
	<backoff-delay-chart/>
</template>

<script lang="ts" setup>
import { SPMA网卡类 } from "@/网络模型/spma";
import ChannelLoadChart from "@/控制面板组件/移动单位/网卡/SPMA网卡/信道负载图表.vue";
import ChannelUtilizationChart from "@/控制面板组件/移动单位/网卡/SPMA网卡/信道利用率图表.vue";
import BackoffDelayChart from "@/控制面板组件/移动单位/网卡/SPMA网卡/退避时延图表/退避时延图表.vue";
import { provide, reactive } from "vue";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { fill, range, zip } from "lodash";

const { SPMA网卡 } = defineProps<{ SPMA网卡: SPMA网卡类 }>();
provide<SPMA网卡类>("SPMA网卡", SPMA网卡);

const 样本数量 = 100;
const 当前时间 = 离散事件仿真器.当前时间;
const 采样间隔 = 0.1;
const 采样时长 = 样本数量 * 采样间隔;
const 起始时间 = 当前时间 - 采样时长 + 1;
const 采样时刻 = range(起始时间, 当前时间 + 采样间隔, 采样间隔);
const 采样结果 = fill(Array(100), 0);
const 样本列表 = <[number, number][]>zip(采样时刻, 采样结果);
const 信道负载样本 = reactive<[number, number][]>([...样本列表]);
const 信道利用率样本 = reactive<[number, number][]>([...样本列表]);

function 获取信道负载(): number {
  const 频道 = SPMA网卡.频道;
  if (频道) {
    return 频道.信道负载预测;
  } else {
    return 0;
  }
}

function 更新信道负载样本(): void {
  const 当前时间 = 离散事件仿真器.当前时间;
  const 信道负载 = 获取信道负载();
  const 信道负载采样数据: [number, number] = [当前时间, 信道负载];
  信道负载样本.push(信道负载采样数据);
  信道负载样本.shift();
}

function 更新信道利用率样本(): void {
  const 当前时间 = 离散事件仿真器.当前时间;
  const 信道负载 = 获取信道负载();
  const 传输速率 = SPMA网卡.传输速率;
  const 信道利用率 = 信道负载 / 传输速率 * 1e2;
  const 信道利用率采样数据: [number, number] = [当前时间, 信道利用率];
  信道利用率样本.push(信道利用率采样数据);
  信道利用率样本.shift();
}

async function 持续采样(): Promise<void> {
  while (true) {
    更新信道负载样本();
    更新信道利用率样本();
    await new Promise<void>(resolve => 离散事件仿真器.添加事件(采样间隔, resolve));
  }
}

持续采样().then();
</script>

<style scoped>

</style>