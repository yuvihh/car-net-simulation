<template>
	<el-dialog :model-value="props.modelValue" title="新建网络接口" width="360px" :modal="false" draggable
						 destroy-on-close
						 @closed="$emit('update:modelValue', false)">
		<network-selector @确认选择="选择网络"/>
		<template #footer>
			<el-button type="primary" @click="确认新建网络接口">确认</el-button>
			<el-button @click="$emit('update:modelValue', false)">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import type 移动单位类 from '@/移动单位/移动单位/移动单位';
import { 网络类 } from '@/网络模型/协议栈';
import type { 网卡类 } from '@/网络模型/网络';
import { computed, inject } from 'vue';
import NetworkSelector from "./网络选择器.vue";

const props = defineProps<{ 网卡: 网卡类, modelValue: boolean }>();
const 网卡 = computed(() => props.网卡);
const emit = defineEmits<{
  (e: "update:modelValue", 对话框可见: boolean): void
}>();
const 单位 = inject<移动单位类>("单位")!;

let 当前选择网络: 网络类 | undefined;

function 选择网络(网络?: 网络类): void {
  当前选择网络 = 网络;
}

function 确认新建网络接口(): void {
  emit("update:modelValue", false);
  const 网络 = 当前选择网络 ? 当前选择网络 : new 网络类();
  单位.网络层协议.创建网络接口(网卡.value, 网络);
  当前选择网络 = undefined;
}
</script>

<style scoped></style>
