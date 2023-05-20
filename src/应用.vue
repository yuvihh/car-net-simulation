<template>
  <control-panel class="控制面板"/>
</template>

<script setup lang="ts">
import ControlPanel from "./控制面板组件/控制面板.vue";
// noinspection ES6UnusedImports
import {
  加载简单网络场景,
	加载TDMA网络场景,
	加载意图驱动随遇接入网络场景,
	加载意图驱动负载均衡网络场景,
	测试递归,
	加载SPMA网络场景,
  加载探测场景
} from "./仿真场景";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import "@/移动单位/链路";
import "./状态/状态";

离散事件仿真器.运行();
// 加载意图驱动负载均衡网络场景();
</script>

<style scoped>
.控制面板 {
    height: 100%;
    width: 100%;
}
</style>
