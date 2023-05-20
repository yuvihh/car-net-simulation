<template>
  <el-dialog :model-value="props.modelValue" title="添加端口" width="360px" :modal="false" destroy-on-close
    @closed="$emit('update:modelValue', false)">
    <NetCardSelector @确认选择="选择网卡"/>
    <template #footer>
      <el-button type="primary" @click="确认新建网络接口">确认</el-button>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import NetCardSelector from "./网卡选择器.vue";
import type { SDN交换机类 } from '@/网络模型/sdn';
import type { 网卡类 } from '@/网络模型/网络';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", 可见: boolean): void }>();
const SDN交换机 = inject<SDN交换机类>("SDN交换机")!;

let 当前选择网卡: 网卡类 | undefined;
function 选择网卡(网卡: 网卡类): void {
  当前选择网卡 = 网卡;
}

function 确认新建网络接口(): void {
  emit("update:modelValue", false);
  if (当前选择网卡) {
    SDN交换机.添加端口(当前选择网卡);
  }
}
</script>

<style scoped></style>