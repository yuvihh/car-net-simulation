<template>
	<el-divider class="顶部分割线"/>
	<el-table class="路由表" :data="路由表格信息列表" highlight-current-row height="800" @current-change="选择路由">
		<template #empty>
			<el-button>
				新建路由
			</el-button>
		</template>
		<el-table-column label="目的网络">
			<template #default="scope">
				<el-link>{{ scope.row.目的网络地址 }}</el-link>
			</template>
		</el-table-column>
		<el-table-column label="下一跳IP地址">
			<template #default="scope">
				<el-link>{{ scope.row.下一跳IP地址 }}</el-link>
			</template>
		</el-table-column>
		<el-table-column label="源网卡">
			<template #default="scope">
				<el-link>{{ scope.row.源网卡 }}</el-link>
			</template>
		</el-table-column>
	</el-table>
	<el-button class="按钮">
		<el-icon>
			<Plus/>
		</el-icon>
	</el-button>
	<el-button class="按钮" @click="删除路由">
		<el-icon>
			<Minus/>
		</el-icon>
	</el-button>
	<el-button class="按钮">
		<el-icon>
			<EditPen/>
		</el-icon>
	</el-button>
	<el-divider class="底部分割线"/>
</template>

<script setup lang="ts">
import { EditPen, Minus, Plus } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import type { 网络层协议类 } from "@/网络模型/协议栈";
import { IPv4 } from "ipaddr.js";

const props = defineProps<{ 网络层协议: 网络层协议类 }>();
const 网络层协议 = props.网络层协议;
const 路由表 = 网络层协议.路由表;

type 路由表格行类型 = {
  目的网络地址: string,
  下一跳IP地址: string,
  源网卡: string
}

const 路由表格信息列表 = computed<路由表格行类型[]>(() => {
  const 路由表格信息列表: 路由表格行类型[] = [];
  for (const [子网后缀长度, _路由表] of 路由表) {
    for (const [IP地址, 路由] of _路由表) {
      路由表格信息列表.push({
        目的网络地址: IP地址.toString() + "/" + 子网后缀长度,
        下一跳IP地址: 路由.下一跳IP地址 ? 路由.下一跳IP地址.toString() : "在链路上",
        源网卡: 路由.源网卡.MAC地址
			});
		}
	}
  return 路由表格信息列表;
});

const 当前选择路由表格行 = ref<路由表格行类型>();

function 选择路由(路由表格行: 路由表格行类型) {
  当前选择路由表格行.value = 路由表格行;
}

function 删除路由() {
  if (当前选择路由表格行.value !== undefined) {
    const 目的网络地址 = IPv4.parseCIDR(当前选择路由表格行.value?.目的网络地址!);
    网络层协议.删除路由(目的网络地址);
  }
}
</script>

<style scoped>
.顶部分割线 {
    margin-top: 20px;
    margin-bottom: 8px;
    padding: 0;
}

.按钮 {
    margin-top: 8px;
    margin-right: 0;
    margin-left: 5px;
}

.底部分割线 {
    margin-top: 9px;
    margin-bottom: 0;
}
</style>
