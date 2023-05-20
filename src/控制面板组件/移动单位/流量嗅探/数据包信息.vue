<template>
	<div class="容器">
		<el-scrollbar>
			<el-tree :data="数据包信息" :props="{ class: '内容' }"/>
		</el-scrollbar>
	</div>
</template>

<script setup lang="ts">
import { 链路层报文类 } from "@/网络模型/网络";
import { inject, type Ref, shallowRef, watch } from "vue";
import { 传输层报文类, 网络层报文类 } from "@/网络模型/协议栈";
import axios from "axios";
import { cloneDeep } from "lodash";

const 数据包 = inject<Ref<链路层报文类 | undefined>>("当前选择数据包")!;

type 树 = {
  label: string,
  children?: 树[]
}

type 数据包字段类型 = {
  链路层: Record<string, any>,
  网络层: Record<string, any>,
  传输层: Record<string, any>,
  应用层: Record<string, any>
}

async function 获取数据包信息(数据包: 链路层报文类): Promise<树[]> {
  const 链路层报文 = cloneDeep(数据包);
  const 网络层报文 = <网络层报文类>链路层报文.载荷;
  const 传输层报文 = <传输层报文类>网络层报文.载荷;
// @ts-ignore
  网络层报文.源IP地址 = 网络层报文.源IP地址.toString();
  // @ts-ignore
  网络层报文.目的IP地址 = 网络层报文.目的IP地址.toString();
  const 响应 = await axios.post("/packet-parser", 链路层报文);
  const 数据包字段 = <数据包字段类型>响应.data;
  const 链路层字段 = 数据包字段["链路层"];
  const 网络层字段 = 数据包字段["网络层"];
  const 传输层字段 = 数据包字段["传输层"];
  const 应用层字段 = 数据包字段["应用层"];
  const 链路层信息: 树 = {
    label: `Ether ${ 链路层报文.源MAC地址 } > ${ 链路层报文.目的MAC地址 } (IPv4)`,
    children: Object.entries(链路层字段).map(([k, v]) => ({ label: `${ k }: ${ v }` }))
  };
  const 网络层信息: 树 = {
    label: `IP ${ 网络层报文.源IP地址 } > ${ 网络层报文.目的IP地址 } (UDP)`,
    children: Object.entries(网络层字段).map(([k, v]) => ({ label: `${ k }: ${ typeof v === "object" ? JSON.stringify(v) : v }` }))
  };
  const 传输层信息: 树 = {
    label: `UDP ${ 传输层报文.源端口 } > ${ 传输层报文.目的端口 } (Raw)`,
    children: Object.entries(传输层字段).map(([k, v]) => ({ label: `${ k }: ${ v }` }))
  };
  const 应用层信息: 树 = {
    label: `Raw`,
    children: Object.entries(应用层字段).map(([k, v]) => ({ label: `${ k }: ${ v }` }))
  };
  return [链路层信息, 网络层信息, 传输层信息, 应用层信息];
}

const 数据包信息 = shallowRef<树[]>();
watch(数据包, 数据包 => {
  if (数据包 !== undefined) {
    获取数据包信息(数据包)
      .then(_数据包信息 => 数据包信息.value = _数据包信息);
  }
})
</script>

<style scoped>
.容器 {
    border: 1px solid var(--el-border-color);
}
</style>

<!--suppress CssUnusedSymbol -->
<style>
.内容 .el-tree-node__content {
    white-space: normal;
    min-height: 26px;
    height: 100%;
}

.内容 .el-tree-node__children {
    line-height: 1.7;
}
</style>
