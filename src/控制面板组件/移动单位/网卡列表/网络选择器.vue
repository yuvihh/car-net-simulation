<template>
  <el-select v-model="当前选择网络选项" value-key="网络地址" placeholder="新建网络" @change="确认选择">
    <el-option v-for="网络选项 of 网络选项列表" :value="网络选项" :label="网络选项.网络地址" />
  </el-select>
</template>

<script setup lang="ts">
import { 网络类 } from '@/网络模型/协议栈';
import { computed, shallowRef } from 'vue';

const emit = defineEmits<{
  (e: "确认选择", 网络?: 网络类): void
}>();

type 网络选项类型 = {
  网络: 网络类,
  网络地址: string
}

const 网络选项列表: 网络选项类型[] = [];
for (const [[IP地址, 后缀长度], 网络] of 网络类.网络映射) {
  const 网络地址 = IP地址.toString() + "/" + 后缀长度;
  const 网络选项 = { 网络: 网络, 网络地址: 网络地址 };
  网络选项列表.push(网络选项);
}

const 当前选择网络选项 = shallowRef<网络选项类型>();
const 当前选择网络 = computed(() => 当前选择网络选项.value?.网络);
function 确认选择(): void {
  emit("确认选择", 当前选择网络.value)
}
</script>