<template>
  <el-divider class="顶部分割线" />
  <el-table :data="应用表格" highlight-current-row stripe height="800">
    <template #empty>
      <el-button size="large">新建应用</el-button>
    </template>
    <el-table-column prop="端口" label="端口号" />
    <el-table-column label="应用">
      <template #default="scope">
        <el-link @click="$emit('打开应用', scope.row.应用)">{{ `${scope.row.类型}` }}</el-link>
      </template>
    </el-table-column>
  </el-table>
  <el-button class="按钮" size="default">
    <el-icon>
      <Plus />
    </el-icon>
  </el-button>
  <el-button class="按钮">
    <el-icon>
      <Minus />
    </el-icon>
  </el-button>
  <el-divider class="底部分割线"></el-divider>
</template>

<script setup lang="ts">
// noinspection TypeScriptCheckImport
import { Plus, Minus } from "@element-plus/icons-vue";
import type { 应用类 } from "@/网络模型/应用";
import { inject, onUnmounted, shallowReactive } from "vue";
import { 应用名称映射 } from "@/配置";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";

defineEmits<{ (e: "打开应用", 应用: 应用类): 应用类 }>();
const 单位 = inject<移动单位类>("单位")!;

interface 应用表格行类型 {
  应用: 应用类;
  端口: number;
  类型: string;
}

function 获取应用表格行(应用: 应用类): 应用表格行类型 {
  return {
    应用: 应用,
    端口: 应用.套接字.端口,
    类型: 应用名称映射.getKey(<typeof 应用类>应用.constructor)!
  }
}

const 应用表格 = shallowReactive(单位.应用列表.map(获取应用表格行));

const 添加应用回调 = (应用: 应用类): void => {
  const 应用表格行 = 获取应用表格行(应用);
  应用表格.push(应用表格行);
};

单位.添加应用事件.添加侦听回调(添加应用回调);
onUnmounted(() => 单位.添加应用事件.移除侦听回调(添加应用回调));
</script>

<style scoped>
.顶部分割线 {
  margin-top: 20px;
  margin-bottom: 8px;
  padding: 0;
}

.底部分割线 {
  margin-top: 9px;
  margin-bottom: 0;
}

.按钮 {
  margin-top: 8px;
  margin-right: 0;
  margin-left: 5px;
}
</style>
