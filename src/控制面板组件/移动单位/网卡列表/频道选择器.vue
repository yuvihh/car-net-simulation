<template>
	<el-select v-model="当前选择频道选项" value-key="频道名称" clearable :placeholder="placeholder" @change="确认选择">
		<el-option v-for="频道选项 of 频道选项列表" :value="频道选项" :label="频道选项.频道名称"/>
	</el-select>
</template>

<script setup lang="ts">
import { 频道类型编号映射 } from '@/状态/状态';
import type { 网卡基类, 频道基类 } from '@/网络模型/网络';
import { 网卡频道类型映射, 频道类型名称映射 } from '@/配置';
import { computed, shallowRef } from 'vue';

const { 网卡 } = defineProps<{ 网卡: 网卡基类 }>();
const emit = defineEmits<{
  (e: "确认选择", 频道?: 频道基类): void
}>();

type 频道选项类型 = {
  频道: 频道基类,
  频道名称: string
}
const 当前选择频道选项 = shallowRef<频道选项类型>();
const 当前选择频道 = computed(() => 当前选择频道选项.value?.频道);
const 频道类型 = computed(() => 网卡频道类型映射.get(<typeof 网卡基类>网卡.constructor)!);
const 频道类型名称 = computed(() => 频道类型名称映射.get(频道类型.value)!);
const placeholder = computed(() => `新建${ 频道类型名称.value }频道`);
const 频道选项列表 = computed(() => {
  const _频道选项列表: 频道选项类型[] = [];
  const _频道编号映射 = 频道类型编号映射.get(频道类型.value)!;
  for (const [频道, 频道编号] of _频道编号映射) {
    const 频道名称 = 频道类型名称.value + "-" + 频道编号;
    const 频道选项 = {
      频道: 频道,
      频道名称: 频道名称
    };
    _频道选项列表.push(频道选项);
  }
  return _频道选项列表;
});

function 确认选择(): void {
  emit("确认选择", 当前选择频道.value);
}
</script>
