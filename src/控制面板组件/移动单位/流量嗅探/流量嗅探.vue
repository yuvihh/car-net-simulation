<template>
	<traffic-info-table class="流量列表" :表格高度="500"/>
	<packet-info class="流量信息" v-model="当前选择数据包"/>
</template>

<script setup lang="ts">
import { provide, shallowRef, watch } from "vue";
import { 网卡基类, 链路层报文类 } from "@/网络模型/网络";
import TrafficInfoTable from "@/控制面板组件/移动单位/流量嗅探/流量信息表格.vue";
import PacketInfo from "@/控制面板组件/移动单位/流量嗅探/数据包信息.vue";

const { 网卡 } = defineProps<{ 网卡: 网卡基类 }>();
provide("网卡", 网卡);

const 当前选择数据包 = shallowRef<链路层报文类>();
provide("当前选择数据包", 当前选择数据包);

function 选择数据包(数据包: 链路层报文类): void {
  当前选择数据包.value = 数据包;
}
</script>

<style scoped>
.流量信息 {
		height: 380px;
		margin-top: 10px;
}
</style>