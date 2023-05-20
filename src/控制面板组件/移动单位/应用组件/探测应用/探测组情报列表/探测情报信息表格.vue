<template>
	<el-table class="探测情报表格" :data="探测目标列表">
		<el-table-column label="目标编号" width="80" align="center">
			<template #default="scope">
				{{ 探测情报信息映射.get(scope.row).目标编号 }}
			</template>
		</el-table-column>
		<el-table-column label="目标类型" width="80" align="center">
			<template #default="scope">
				{{ 探测情报信息映射.get(scope.row).目标类型 }}
			</template>
		</el-table-column>
		<el-table-column label="探测状态" width="100" align="center">
			<template #default="scope">
				<el-tag v-if="探测情报信息映射.get(scope.row).探测状态.value === '跟踪中'" class="标签" size="large">跟踪中
				</el-tag>
				<el-tag v-else class="标签" type="danger" size="large">已丢失</el-tag>
			</template>
		</el-table-column>
		<el-table-column label="坐标" width="220" align="center">
			<template #default="scope">
				{{ 探测情报信息映射.get(scope.row).坐标.value.toString() }}
			</template>
		</el-table-column>
		<el-table-column label="操作" align="center">
			<template #default="scope">
				<el-popconfirm title="确认删除目标" @confirm="确认删除(scope.row)">
					<template #reference>
						<el-button type="danger" plain>删除</el-button>
					</template>
				</el-popconfirm>
			</template>
		</el-table-column>
	</el-table>
</template>

<script lang="ts" setup>
import { inject, type Ref, type ShallowReactive } from "vue";
import 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 探测应用类, type 探测目标类型, 经纬度坐标类 } from "@/网络模型/应用";
import { 导弹类 } from "@/移动单位/导弹";

const 探测应用 = inject<探测应用类>("探测应用")!;
const { 探测组员 } = defineProps<{ 探测组员: 探测应用类 }>();
const 探测单位 = 探测组员.单位;

type 探测情报信息类型 = {
  目标编号: number,
  目标类型: string,
  探测状态: Ref<"跟踪中" | "已丢失">,
  坐标: Ref<经纬度坐标类>
}

const 探测组员探测情报信息映射 = inject<Map<移动单位类, Map<移动单位类, 探测情报信息类型>>>("探测组员探测情报信息映射")!;
const 探测单位探测目标列表映射 = inject<Map<移动单位类, ShallowReactive<移动单位类[]>>>("探测单位探测目标列表映射")!;
const 探测情报信息映射 = 探测组员探测情报信息映射.get(探测单位)!;
const 探测目标列表 = 探测单位探测目标列表映射.get(探测单位)!;

function 确认删除(目标: 探测目标类型): void {
  new 导弹类(探测应用.单位, 目标);
}
</script>

<style scoped>
.探测情报表格 {
		margin-top: -8px;
		margin-bottom: -8px;
}

.标签 {
    font-size: var(--el-font-size-base);
}
</style>