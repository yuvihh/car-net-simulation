<template>
	<el-table class="网络设备信息表格" highlight-current-row :data="网络设备表格" height="830"
						@current-change="选择网络设备">
		<el-table-column label="名称" width="120">
			<template #default="scope">
				<el-link @click="$emit('点击网络设备链接', toRaw(scope.row.网络设备))">
					{{ scope.row.名称 }}
				</el-link>
			</template>
		</el-table-column>
		<el-table-column label="类型">
			<template #default="scope">
				{{ scope.row.类型 }}
			</template>
		</el-table-column>
		<template #empty>
			<el-button>新建网络设备</el-button>
		</template>
	</el-table>
	<el-button class="按钮" @click="新建网络设备">
		<el-icon>
			<Plus/>
		</el-icon>
	</el-button>
	<el-button class="按钮" :disabled="禁用删除网络设备按钮" @click="删除网络设备">
		<el-icon>
			<Minus/>
		</el-icon>
	</el-button>
	<el-divider class="底部分割线"/>
</template>

<script setup lang="ts">
// noinspection TypeScriptCheckImport
import { Minus, Plus } from "@element-plus/icons-vue";
import type { 网络设备类 } from "@/网络模型/网络";
import { 网络设备类型名称映射 } from "@/配置";
import { computed, inject, markRaw, ref, type ShallowReactive, shallowRef, toRaw } from "vue";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";

defineEmits<{ (信号: "点击网络设备链接", 网络设备: 网络设备类): 网络设备类 }>();
const 网络设备名称映射 = inject<ShallowReactive<Map<网络设备类, string>>>("网络设备名称映射")!;
const 单位 = inject<移动单位类>("单位")!;

type 网络设备表格行类型 = {
  网络设备: 网络设备类,
  名称: string,
  类型: string
}

const 网络设备表格 = computed(() => {
  const _网络设备表格: 网络设备表格行类型[] = [];
  for (const [网络设备, 网络设备名称] of 网络设备名称映射) {
    markRaw(网络设备);
    const 网络设备表格行 = {
      网络设备: 网络设备,
      名称: 网络设备名称,
      类型: 网络设备类型名称映射.get(<typeof 网络设备类>网络设备.constructor)!
    };
    _网络设备表格.push(网络设备表格行);
  }
  return _网络设备表格;
});

const 当前选择网络设备 = shallowRef<网络设备类>();
const 禁用删除网络设备按钮 = ref(true);

function 选择网络设备(网络设备表格行?: 网络设备表格行类型): void {
  当前选择网络设备.value = 网络设备表格行?.网络设备;
  禁用删除网络设备按钮.value = false;
}

function 新建网络设备(): void {

}

function 删除网络设备(): void {
  单位.删除网络设备(当前选择网络设备.value!);
}
</script>

<style scoped>
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
