<template>
	<el-tabs v-model="当前标签页名称">
		<el-tab-pane label="拓扑视图" name="拓扑视图">
			<Topology/>
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts">
import type {SDN控制器类} from '@/网络模型/sdn';
import {provide, ref} from 'vue';
import Topology from "@/控制面板组件/移动单位/SDN控制器/网络拓扑视图.vue";

const { SDN控制器 } = defineProps<{ SDN控制器: SDN控制器类 }>();
provide("SDN控制器", SDN控制器);

const 当前标签页名称 = ref("拓扑视图");
</script>