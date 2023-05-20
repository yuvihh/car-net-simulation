<template>
  <el-descriptions border size="default" title="控制器信息">
    <template #extra>
      <el-button v-if="控制器" type="danger" plain>断开连接</el-button>
      <el-button v-else type="primary" plain>连接控制器</el-button>
    </template>
    <el-descriptions-item label="控制器" label-align="center">
      <el-link>{{ 控制器名称 }}</el-link>
    </el-descriptions-item>
    <el-descriptions-item label="连接状态" align="center">
      <el-tag v-if="控制器" class="标签" size="large" type="success" effect="dark">已连接</el-tag>
      <el-tag v-else class="标签" size="large" type="info">未连接</el-tag>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import type { SDN交换机类 } from '@/网络模型/sdn';
import { computed, inject, shallowRef } from 'vue';
import { SDN控制器编号映射 } from "@/状态/状态";

const SDN交换机 = inject<SDN交换机类>("SDN交换机")!;

const 控制器 = shallowRef(SDN交换机.控制器);
SDN交换机.设置控制器事件.添加侦听回调(_控制器 => 控制器.value = _控制器);

const 控制器名称 = computed(() => {
  const _控制器 = 控制器.value;
  if (_控制器) {
    const 编号 = SDN控制器编号映射.get(_控制器);
    return "SDN控制器-" + 编号;
  } else {
    return "未连接";
  }
});
</script>

<style scoped>
.标签 {
		font-size: var(--el-font-size-base);
}
</style>
