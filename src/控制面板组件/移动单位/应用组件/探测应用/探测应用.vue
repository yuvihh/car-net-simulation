<template>
	<div>
		<statistic class="项目"/>
		<spy-target-list class="项目" :探测应用="探测应用"/>
		<spy-group-info-list class="项目"/>
	</div>
</template>

<script setup lang="ts">
import { 探测应用类 } from "@/网络模型/应用";
import { provide } from "vue";
import Statistic from "@/控制面板组件/移动单位/应用组件/探测应用/统计信息.vue";
import SpyTargetList from "@/控制面板组件/移动单位/应用组件/探测应用/探测情报列表.vue";
import SpyGroupInfoList from "@/控制面板组件/移动单位/应用组件/探测应用/探测组情报列表/探测组情报列表.vue";

const { 探测应用 } = defineProps<{ 探测应用: 探测应用类 }>();
provide("探测应用", 探测应用);
</script>

<style scoped>
.项目 {
		margin-bottom: 30px;
}
</style>