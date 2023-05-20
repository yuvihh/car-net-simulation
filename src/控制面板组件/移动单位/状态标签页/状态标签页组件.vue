<template>
	<el-row :gutter=10>
		<el-col :span="24">
			<Status class="状态" :单位="单位"/>
		</el-col>
	</el-row>
</template>

<script setup lang="ts">
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import Status from "./状态组件.vue";

defineProps<{ 单位: 移动单位类 }>();
</script>
