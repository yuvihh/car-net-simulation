<template>
	<el-dialog
		:model-value="props.modelValue"
		title="加入频道"
		width="360px"
		:modal="false"
		:draggable="true"
		destroy-on-close
		@closed="$emit('update:modelValue', false)"
	>
		<ChannelSelector :网卡="网卡" @确认选择="选择频道"/>
		<template #footer>
			<el-button type="primary" @click="确认加入频道">确认</el-button>
			<el-button @click="取消加入频道">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import type { 网卡类, 频道基类 } from '@/网络模型/网络';
import { computed } from "@vue/reactivity";
import ChannelSelector from "./频道选择器.vue";
import { 网卡频道类型映射 } from '@/配置';

const props = defineProps<{ 网卡: 网卡类, modelValue: boolean }>();
const 网卡 = computed(() => props.网卡);
const emit = defineEmits<{
  (e: "update:modelValue", 可见性: boolean): void
}>();

let 当前选择频道: 频道基类 | undefined;

function 选择频道(频道?: 频道基类): void {
  当前选择频道 = 频道;
}

function 确认加入频道(): void {
  emit("update:modelValue", false);
  let 频道 = 当前选择频道;
  if (!频道) {
    const 频道类型 = 网卡频道类型映射.get(<typeof 网卡类>网卡.value.constructor)!;
    频道 = new 频道类型();
  }
  频道.加入网卡(网卡.value);
  当前选择频道 = undefined;
}

function 取消加入频道(): void {
  emit("update:modelValue", false);
}
</script>
