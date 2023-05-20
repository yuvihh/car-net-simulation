<template>
	<el-table :data="网络接口列表" highlight-current-row @current-change="选择网络接口">
		<template #empty>
			<el-button size="large" @click="$emit('点击新建网络按钮', 网卡)">
				新建网络接口
			</el-button>
		</template>
		<el-table-column label="IP地址" width="160" align="center">
			<template #default="scope">
				{{ 网络接口信息映射.get(scope.row).IP地址 }}
			</template>
		</el-table-column>
	</el-table>
	<el-button class="按钮" size="default" @click="$emit('点击新建网络按钮', 网卡)">
		<el-icon>
			<Plus/>
		</el-icon>
	</el-button>
	<el-button class="按钮" :disabled="禁用删除网络接口按钮" @click="删除网络接口">
		<el-icon>
			<Minus/>
		</el-icon>
	</el-button>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, shallowReactive, shallowRef } from 'vue';
// noinspection TypeScriptCheckImport
import { Minus, Plus } from "@element-plus/icons-vue";
import type { IPv4 } from 'ipaddr.js';

import type 移动单位类 from '@/移动单位/移动单位/移动单位';
import type { 网络接口类 } from '@/网络模型/协议栈';
import type { 网卡基类 } from '@/网络模型/网络';

defineEmits<{
  (e: "点击新建网络按钮", 网卡: 网卡基类): void;
}>();

const { 网卡 } = defineProps<{ 网卡: 网卡基类 }>();
const 单位 = inject<移动单位类>("单位")!;
const 网络层协议 = 单位.网络层协议;

type 网络接口信息类型 = {
  IP地址: string
};
const 网络接口信息映射 = shallowReactive(new Map<网络接口类, 网络接口信息类型>());
const 网络接口列表 = computed(() => [...网络接口信息映射.keys()]);

function 获取网络接口信息(网络接口: 网络接口类): 网络接口信息类型 {
  const IP地址 = 网络接口.IP地址.toString();
  return { IP地址: IP地址 };
}

const 添加网络接口回调 = (_IP地址: IPv4, 网络接口: 网络接口类) => {
  if (网络接口.网卡 === 网卡) {
    const 网络接口信息 = 获取网络接口信息(网络接口);
    网络接口信息映射.set(网络接口, 网络接口信息);
  }
};
const 删除网络接口回调 = (网络接口: 网络接口类) => {
  if (网络接口.网卡 === 网卡) {
    网络接口信息映射.delete(网络接口);
  }
};
网络层协议.网络接口映射.forEach(([IP地址, 网络接口]) => 添加网络接口回调(IP地址, 网络接口));
网络层协议.添加网络接口事件.添加侦听回调(添加网络接口回调);
网络层协议.删除网络接口事件.添加侦听回调(删除网络接口回调);
onUnmounted(() => 网络层协议.添加网络接口事件.移除侦听回调(添加网络接口回调));
onUnmounted(() => 网络层协议.删除网络接口事件.移除侦听回调(删除网络接口回调));

const 当前选择网络接口 = shallowRef();
const 禁用删除网络接口按钮 = ref(true);

function 选择网络接口(网络接口?: 网络接口类): void {
  当前选择网络接口.value = 网络接口;
  禁用删除网络接口按钮.value = Boolean(网络接口);
}

function 删除网络接口(网络接口: 网络接口类): void {
  网络层协议.删除网络接口(网络接口);
  选择网络接口(undefined);
}
</script>

<style scoped>
.按钮 {
    margin-top: 8px;
    margin-right: 0;
    margin-left: 5px;
}
</style>