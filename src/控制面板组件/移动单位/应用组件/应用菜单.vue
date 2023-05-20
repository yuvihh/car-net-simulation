<template>
	<div class="卡片容器">
		<el-card class="卡片" header="网络功能">
			<el-button class="应用按钮" size="large" @click="弹出新建回显服务器对话框">
				回显服务器
			</el-button>
			<el-button class="应用按钮" size="large">回显客户端</el-button>
		</el-card>
	</div>
	<el-dialog v-model="新建回显服务器对话框可见" class="对话框" title="新建回显服务器" :width="270" :modal="false"
						 draggable destroy-on-close>
		<el-form class="对话框表单">
			<el-form-item label="网络接口">
				<el-select v-model="新建回显服务器网络接口" filterable fit-input-width>
					<el-option v-for="网络接口 of 单位.网络层协议.网络接口列表" :value="网络接口"
										 :label="网络接口.IP地址.toString()"/>
				</el-select>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button type="primary" @click="确认新建回显服务器">确认</el-button>
			<el-button @click="取消新建回显服务器">取消</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { 回显服务器类 } from "@/网络模型/应用";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 网络接口类 } from "@/网络模型/协议栈";
import { defineProps, ref } from "vue";

const { 单位 } = defineProps<{ 单位: 移动单位类 }>();

const 新建回显服务器对话框可见 = ref(false);
const 新建回显服务器网络接口 = ref<网络接口类>();

function 弹出新建回显服务器对话框(): void {
  新建回显服务器对话框可见.value = true
}

function 取消新建回显服务器(): void {
  新建回显服务器对话框可见.value = false;
}

function 确认新建回显服务器(): void {
  新建回显服务器对话框可见.value = false;
  if (新建回显服务器网络接口.value instanceof 网络接口类) {
    new 回显服务器类(单位, 新建回显服务器网络接口.value);
  }
}
</script>

<style scoped>
.卡片容器 {
    margin-right: 10px;
}

.卡片 {
    height: 200px;
}

.应用按钮 {
    font-size: 16px;
}

.对话框表单 {
    margin: 0;
    padding: 0;
}
</style>
