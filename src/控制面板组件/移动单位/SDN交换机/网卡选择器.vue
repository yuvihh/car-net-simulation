<template>
  <el-select v-model="当前选择网卡选项" value-key="网卡名称" clearable placeholder="请选择网卡" @change="确认选择">
    <el-option v-for="网卡选项 of 网卡选项列表" :value="网卡选项" :label="网卡选项.网卡名称" />
  </el-select>
</template>

<script setup lang="ts">
import type { SDN交换机类 } from '@/网络模型/sdn';
import { 网卡类, type 网络设备类 } from '@/网络模型/网络';
import { inject, shallowRef } from 'vue';

const SDN交换机 = inject<SDN交换机类>("SDN交换机")!;
const 网络设备名称映射 = inject<Map<网络设备类, string>>("网络设备名称映射")!;
const emit = defineEmits<{ (e: "确认选择", 网卡: 网卡类): void }>();

type 网卡选项类型 = {
  网卡: 网卡类,
  网卡名称: string
}

const 当前选择网卡选项 = shallowRef<网卡选项类型>();

const 端口集合 = SDN交换机.端口集合;
const 网卡选项列表: 网卡选项类型[] = [];
for (const [网络设备, 网络设备名称] of 网络设备名称映射) {
  if (网络设备 instanceof 网卡类 && !端口集合.has(网络设备)) {
    const 网卡选项 = { 网卡: 网络设备, 网卡名称: 网络设备名称 };
    网卡选项列表.push(网卡选项);
  }
}

function 确认选择(网卡选项?: 网卡选项类型): void {
  if (网卡选项) {
    const 网卡 = 网卡选项.网卡;
    emit("确认选择", 网卡);
  }
}
</script>

<style scoped></style>
