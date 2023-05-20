<template>
	<div class="标题">意图驱动车联网仿真平台</div>
	<div class="场景选项">
		<el-divider class="分割线" content-position="left">
			<template #default>
				<div class="选择场景标题">选择场景</div>
			</template>
		</el-divider>
		<div v-for="场景名称 in 场景加载函数映射.keys()" class="场景按钮">
			<load-button :场景名称="场景名称" />
		</div>
		<el-divider class="底部分割线" />
		<div class="操作区域">
			<el-button class="操作按钮" size="large" type="info" plain @click="新建场景">新建场景</el-button>
			<el-button class="操作按钮" size="large" type="primary" plain @click="重置场景">重置场景</el-button>
			<el-button class="操作按钮" size="large" type="success" plain>保存场景</el-button>
			<el-button class="操作按钮" size="large" type="danger" plain @click="退出平台">退出平台</el-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { 场景加载函数映射 } from "@/配置";
import LoadButton from "./加载场景按钮.vue";

function 新建场景(): void {
  location.reload();
}

function 重置场景(): void {
  location.reload();
}

function 退出平台(): void {
  window.close();
}
</script>

<style scoped>
.标题 {
    text-align: center;
    font-size: 36px;
    font-family: "Ubuntu", "楷体", sans-serif;
}

.分割线 {
		display: block;
		font-size: 18px;
}

.底部分割线 {
		margin-bottom: 20px;
}

.场景选项 {
		width: auto;
    margin-left: 20px;
    margin-right: 15px;
}

.选择场景标题 {
		font-size: 20px;
		font-family: "Ubuntu", "楷体", sans-serif;
		/*border: 1px solid var(--el-border-color);*/
		padding: 5px;
		/*border-radius: 10px;*/
}

.场景按钮 {
    text-align: center;
		margin: 20px;
}

.场景按钮内容 {
    font-size: 24px;
    font-family: "Ubuntu", "楷体", sans-serif;
    align-content: center;
		width: 80%;
}

.操作按钮 {
    font-size: 20px;
    font-family: "Ubuntu", "楷体", sans-serif;
}

.按钮文字 {
		color: white;
}

.操作区域 {
		text-align: center;
}
</style>