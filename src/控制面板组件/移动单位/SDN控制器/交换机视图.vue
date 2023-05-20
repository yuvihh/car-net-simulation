<template>
  <el-table class="交换机表格" :data="交换机表格" highlight-current-row height="800">
    <el-table-column prop="交换机编号" label="编号" width="60" align="center"/>
    <el-table-column prop="节点信息" label="节点信息" width="200" align="center"/>
    <el-table-column prop="端口数量" label="端口数量" width="80" align="center"/>
    <el-table-column prop="相邻交换机编号列表" label="相邻交换机编号列表" align="center"/>
  </el-table>
</template>

<script setup lang="ts">
import { SDN交换机类, SDN控制器类 } from "@/网络模型/sdn";
import { inject, markRaw, type Raw, reactive } from "vue";
import { computed } from "@vue/reactivity";
import { 节点编号映射, 节点网络设备类型编号映射 } from "@/状态/状态";
import type { ReactiveVariable } from "vue/macros";

const SDN控制器 = inject<SDN控制器类>("SDN控制器")!;
const 交换机编号映射 = inject<Map<SDN交换机类, number>>("交换机编号映射")!;

interface 交换机信息类型 {
  交换机编号: number,
  节点信息: string,
  端口数量: number,
  相邻交换机编号列表: ReactiveVariable<number[]>;
}

function 获取节点信息(交换机: SDN交换机类): string {
  const 节点 = 交换机.节点;
  const 节点编号 = 节点编号映射.get(节点)!;
  const 节点名称 = "节点-" + 节点编号;
  const 网络设备类型编号映射 = 节点网络设备类型编号映射.get(节点)!;
  const 网络设备编号映射 = 网络设备类型编号映射.get(SDN交换机类)!;
  const 网络设备编号 = 网络设备编号映射.get(交换机);
  const 网络设备名称 = "SDN交换机-" + 网络设备编号;
  return `${ 节点名称 }(${ 网络设备名称 })`;
}

function 获取相邻交换机编号列表(交换机: SDN交换机类): number[] {
  const 交换机连接端口映射 = SDN控制器.交换机连接端口映射;
  const 该交换机连接端口映射 = 交换机连接端口映射.get(交换机)!;
  const 相邻交换机编号列表: number[] = [];
  该交换机连接端口映射.forEach((_, 相邻交换机) => {
    const 相邻交换机编号 = 交换机编号映射.get(相邻交换机)!;
    相邻交换机编号列表.push(相邻交换机编号);
  });
  return 相邻交换机编号列表;
}

function 获取交换机信息(交换机: SDN交换机类): 交换机信息类型 {
  const 交换机编号 = 交换机编号映射.get(交换机)!;
  const 节点信息 = 获取节点信息(交换机);
  const 端口数量 = 交换机.端口集合.size;
  let 相邻交换机编号列表 = 获取相邻交换机编号列表(交换机);
  相邻交换机编号列表 = reactive(相邻交换机编号列表);
  return {
    交换机编号: 交换机编号,
    节点信息: 节点信息,
    端口数量: 端口数量,
    相邻交换机编号列表: 相邻交换机编号列表
  };
}

interface 交换机表格行类型 extends 交换机信息类型 {
  交换机: Raw<SDN交换机类>
}

function 获取交换机表格行(交换机: SDN交换机类): 交换机表格行类型 {
  markRaw(交换机);
  const 交换机信息 = 获取交换机信息(交换机);
  const 交换机表格行: any = {...交换机信息};
  交换机表格行.交换机 = 交换机;
  return 交换机表格行;
}

const 交换机表格 = computed(() => {
  const _交换机表格: 交换机表格行类型[] = [];
  交换机编号映射.forEach((_, 交换机) => {
    const 交换机表格行 = 获取交换机表格行(交换机);
    _交换机表格.push(交换机表格行);
  });
  return _交换机表格;
})
</script>

<style scoped>

</style>