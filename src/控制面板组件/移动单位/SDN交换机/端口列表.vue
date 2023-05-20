<template>
	<div class="表格容器">
		<el-divider class="顶部分割线" content-position="left" border-style="hide">端口信息</el-divider>
		<el-table class="端口列表" :data="端口表格" highlight-current-row :height="280" @current-change="选择端口">
			<el-table-column type="index" label="编号" width="60" align="center"/>
			<el-table-column label="MAC地址" prop="MAC地址" width="170" align="center"/>
			<el-table-column label="发送包数" prop="发送包数" width="80" align="center"/>
			<el-table-column label="接收包数" prop="接收包数" width="80" align="center"/>
			<el-table-column label="发送字节" prop="发送字节" width="80" align="center"/>
			<el-table-column label="接收字节" prop="接收字节" width="80" align="center"/>
		</el-table>
		<el-button class="按钮" size="default" @click="打开添加端口对话框">
			<el-icon>
				<Plus/>
			</el-icon>
		</el-button>
		<el-button class="按钮" :disabled="禁用删除端口按钮" @click="删除端口">
			<el-icon>
				<Minus/>
			</el-icon>
		</el-button>
		<el-divider class="底部分割线" border-style="hide"></el-divider>
	</div>
	<add-port-dialog v-model="添加端口对话框可见"/>
</template>

<script setup lang="ts">
import type { SDN交换机类 } from '@/网络模型/sdn';
import { 网卡基类 } from "@/网络模型/网络";
import { computed, inject, markRaw, onUnmounted, type Ref, ref, shallowReactive, shallowRef, toRaw } from 'vue';
import { Minus, Plus } from "@element-plus/icons-vue";
import AddPortDialog from './添加端口对话框.vue';

const SDN交换机 = inject<SDN交换机类>("SDN交换机")!;

interface 端口信息类型 {
  MAC地址: string;
  发送包数: Ref<number>;
  接收包数: Ref<number>;
  发送字节: Ref<number>;
  接收字节: Ref<number>;
}

const 端口信息映射 = shallowReactive(new Map<网卡基类, 端口信息类型>());

const 端口发送回调映射 = new Map<网卡基类, () => void>();
const 端口接收回调映射 = new Map<网卡基类, () => void>();
const 添加端口回调 = (端口: 网卡基类) => {
  const 端口流量记录 = SDN交换机.端口流量记录映射.get(端口)!;
	const 端口信息: 端口信息类型 = {
    MAC地址: 端口.MAC地址,
    发送包数: ref(端口流量记录.发送包数),
    接收包数: ref(端口流量记录.接收包数),
    发送字节: ref(端口流量记录.发送字节),
    接收字节: ref(端口流量记录.接收字节),
	};
	端口信息映射.set(端口, 端口信息);
  const 端口发送回调 = () => {
    端口信息.发送包数.value = 端口流量记录.发送包数;
    端口信息.发送字节.value = 端口流量记录.发送字节;
  };
  const 端口接收回调 = () => {
    端口信息.接收包数.value = 端口流量记录.接收包数;
    端口信息.接收字节.value = 端口流量记录.接收字节;
  };
  端口.传输完成事件.添加侦听回调(端口发送回调);
  端口.接收事件.添加侦听回调(端口接收回调);
  端口发送回调映射.set(端口, 端口发送回调);
  端口接收回调映射.set(端口, 端口接收回调);
};
const 删除端口回调 = (端口: 网卡基类) => {
  端口信息映射.delete(端口);
  const 端口发送回调 = 端口发送回调映射.get(端口)!;
  const 端口接收回调 = 端口接收回调映射.get(端口)!;
  端口.传输完成事件.移除侦听回调(端口发送回调);
  端口.接收事件.移除侦听回调(端口接收回调);
};
SDN交换机.端口集合.forEach(添加端口回调);
SDN交换机.添加端口事件.添加侦听回调(添加端口回调);
SDN交换机.删除端口事件.添加侦听回调(删除端口回调);
onUnmounted(() => SDN交换机.添加端口事件.移除侦听回调(添加端口回调));
onUnmounted(() => SDN交换机.删除端口事件.移除侦听回调(删除端口回调));

interface 端口表格行类型 extends 端口信息类型 {
  端口: 网卡基类;
}

const 端口表格 = computed(() => {
  const _端口表格: 端口表格行类型[] = [];
  for (const [端口, 端口信息] of 端口信息映射) {
    const 端口表格行 = {
      端口: markRaw(端口),
      ...端口信息
    };
    _端口表格.push(端口表格行);
  }
  return _端口表格;
});

const 当前选择端口 = shallowRef<网卡基类>();
const 禁用删除端口按钮 = ref(true);

function 选择端口(端口表格行?: 端口表格行类型): void {
  if (端口表格行) {
    当前选择端口.value = toRaw(端口表格行.端口);
    禁用删除端口按钮.value = false;
  }
}

function 删除端口(): void {
  SDN交换机.删除端口(当前选择端口.value!);
}

const 添加端口对话框可见 = ref(false);

function 打开添加端口对话框(): void {
  添加端口对话框可见.value = true;
}
</script>

<style scoped>
.表格容器 {
    border: 1px solid var(--el-border-color);
}

.顶部分割线 {
    margin: 0;
    z-index: 2;
}

.按钮 {
    margin-top: 8px;
    margin-right: 0;
    margin-left: 5px;
}

.底部分割线 {
    margin-top: 8px;
    margin-bottom: 0;
    z-index: 2;
}
</style>
