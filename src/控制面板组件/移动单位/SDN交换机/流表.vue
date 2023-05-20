<template>
	<div class="表格容器">
		<el-divider class="顶部分割线" content-position="left" border-style="hide">流表</el-divider>
		<el-table :data="流表表格" :height="360" highlight-current-row @current-change="选择流表项">
			<el-table-column label="匹配字段" prop="匹配字段信息" :width="265" align="left"/>
			<el-table-column label="动作字段" prop="动作字段信息" :width="205" align="left"/>
			<el-table-column label="优先级" prop="优先级" align="center"/>
		</el-table>
		<el-button class="按钮" size="default" @click="打开添加流表项对话框">
			<el-icon>
				<Plus/>
			</el-icon>
		</el-button>
		<el-button class="按钮" :disabled="禁用删除流表项按钮" @click="删除流表项">
			<el-icon>
				<Minus/>
			</el-icon>
		</el-button>
		<el-divider class="底部分割线" border-style="hide"></el-divider>

	</div>
</template>

<script setup lang="ts">
import { type SDN交换机类, 头字段列表, type 头字段类型, type 流表项类型 } from '@/网络模型/sdn';
import { computed, inject, onUnmounted, ref, shallowRef } from 'vue';
import { Minus, Plus } from "@element-plus/icons-vue";
import { pickBy } from "lodash";
import { 网卡基类 } from "@/网络模型/网络";

const SDN交换机 = inject<SDN交换机类>("SDN交换机")!;

const 流表 = shallowRef<流表项类型[]>([...SDN交换机.流表]);
const 更新流表回调 = () => 流表.value = [...SDN交换机.流表];
SDN交换机.添加流表项事件.添加侦听回调(更新流表回调);
SDN交换机.删除流表项事件.添加侦听回调(更新流表回调);
onUnmounted(() => SDN交换机.添加流表项事件.移除侦听回调(更新流表回调));
onUnmounted(() => SDN交换机.删除流表项事件.移除侦听回调(更新流表回调));

type 流表表格行类型 = {
  索引: number,
  匹配字段信息: string,
  优先级: number,
  动作字段信息: string
};

const 流表表格 = computed(() => {
  const _流表表格 = [];
  const _流表 = 流表.value;
  for (let i = 0; i < _流表.length; i++) {
    const 流表项 = _流表[i];
    const 头字段值 = <头字段类型>pickBy(流表项, (值, 键) => (<string[]>头字段列表).includes(键));
    const 匹配字段 = pickBy(头字段值, 值 => 值 !== undefined);
    const 匹配字段信息 = 获取匹配字段信息(匹配字段);
    const 优先级 = 流表项.优先级;
    const 输出端口 = 流表项.输出端口;
    const 动作字段信息 = 获取动作字段信息(输出端口);
    const 表格行: 流表表格行类型 = {
      索引: i,
      匹配字段信息: 匹配字段信息,
      优先级: 优先级,
      动作字段信息: 动作字段信息
    };
    _流表表格.push(表格行);
  }
  return _流表表格;
});

function 去除外层大括号(字符串: string): string {
  return 字符串.slice(1, 字符串.length - 1);
}

function 去除双引号(字符串: string): string {
  return 字符串.replaceAll("\"", "");
}

function 替换头字段名称(字符串: string): string {
  字符串 = 字符串.replace("源MAC地址", "源MAC");
  字符串 = 字符串.replace("目的MAC地址", "目的MAC");
  字符串 = 字符串.replace("源IP地址", "源IP");
  字符串 = 字符串.replace("目的IP地址", "目的IP");
  return 字符串;
}

function 获取匹配字段信息(匹配字段: 头字段类型): string {
  let 匹配字段信息 = JSON.stringify(匹配字段, undefined, 1);
  匹配字段信息 = 去除外层大括号(匹配字段信息);
  匹配字段信息 = 去除双引号(匹配字段信息);
  匹配字段信息 = 替换头字段名称(匹配字段信息);
  return 匹配字段信息;
}

function 获取动作字段信息(输出端口: 网卡基类): string {
  const 动作字段 = { 输出端口: 输出端口.MAC地址 };
  let 动作字段信息 = JSON.stringify(动作字段, undefined, 1);
  动作字段信息 = 去除外层大括号(动作字段信息);
  动作字段信息 = 去除双引号(动作字段信息);
  return 动作字段信息;
}

const 当前选择流表项索引 = ref();
const 禁用删除流表项按钮 = ref(true);

function 选择流表项(流表表格行: 流表表格行类型): void {
  if (流表表格行) {
    当前选择流表项索引.value = 流表表格行.索引;
    禁用删除流表项按钮.value = false;
  }
}

function 删除流表项(): void {
  const 流表项索引 = 当前选择流表项索引.value;
  SDN交换机.删除流表项(流表项索引);

}

function 打开添加流表项对话框(): void {

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
