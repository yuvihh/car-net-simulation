<template>
	<el-button class="场景按钮内容" size="large" type="primary" plain @click="加载场景">
		<div class="按钮文字">{{ 场景名称 }}</div>
	</el-button>
</template>

<script setup lang="ts">
import { 场景加载函数映射 } from "@/配置";

const { 场景名称 } = defineProps<{ 场景名称: string }>();

function 加载场景(): void {
  const 场景加载函数 = 场景加载函数映射.get(场景名称)!;
  场景加载函数();
}
</script>

<style scoped>
.按钮文字 {
    color: white;
}
</style>