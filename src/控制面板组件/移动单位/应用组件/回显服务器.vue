<template>
  <el-divider class="顶部分割线" content-position="left">请求记录</el-divider>
  <el-table :data="请求记录列表" height="850px">
    <el-table-column prop="时间" label="时间" width="200"/>
    <el-table-column prop="源IP地址" label="源网址" width="120" />
    <el-table-column prop="源端口" label="源端口" width="100" />
    <el-table-column prop="请求内容" label="请求内容"/>
  </el-table>
</template>

<script setup lang="ts">
import type { 回显服务器类 } from "@/网络模型/应用";
import { onUnmounted, reactive } from "vue";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import type { IPv4 } from "ipaddr.js";

const { 回显服务器 } = defineProps<{ 回显服务器: 回显服务器类 }>();

interface 请求记录类型 {
  时间: number,
  源IP地址: string,
  源端口: number,
  请求内容: string,
}

const 请求记录列表 = reactive<请求记录类型[]>([]);

const 接收请求回调 = (报文内容: string, 源IP地址: IPv4, 源端口: number) => {
  请求记录列表.push({
    时间: 离散事件仿真器.当前时间,
    源IP地址: 源IP地址.toString(),
    源端口: 源端口,
    请求内容: 报文内容,
  });
};

回显服务器.接收数据事件.添加侦听回调(接收请求回调);
onUnmounted(() => 回显服务器.接收数据事件.移除侦听回调(接收请求回调));
</script>

<style scoped>
.顶部分割线 {
    margin-top: 20px;
    margin-bottom: 8px;
    padding: 0;
}
</style>
