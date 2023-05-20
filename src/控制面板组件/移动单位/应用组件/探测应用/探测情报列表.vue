<template>
	<div class="容器">
		<el-divider border-style="hidden" class="分割线" content-position="left">探测情报</el-divider>
		<el-table :data="探测目标列表" height="350px">
			<el-table-column align="center" label="目标编号" width="80">
				<template #default="scope">
					{{ 探测情报信息映射.get(scope.row).目标编号 }}
				</template>
			</el-table-column>
			<el-table-column align="center" label="目标类型" width="80">
				<template #default="scope">
					{{ 探测情报信息映射.get(scope.row).目标类型 }}
				</template>
			</el-table-column>
			<el-table-column align="center" label="探测状态" width="100">
				<template #default="scope">
					<el-tag v-if="探测情报信息映射.get(scope.row).探测状态.value === '跟踪中'" class="标签" size="large">跟踪中</el-tag>
					<el-tag v-else class="标签" effect="light" size="large" type="danger">已丢失</el-tag>
				</template>
			</el-table-column>
			<el-table-column align="center" label="坐标" width="220">
				<template #default="scope">
					{{ 探测情报信息映射.get(scope.row).坐标.value }}
				</template>
			</el-table-column>
			<el-table-column align="center" label="操作">
				<template #default="scope">
					<el-popconfirm title="确认删除目标" @confirm="确认删除(scope.row)">
						<template #reference>
							<el-button type="danger" plain>删除</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script lang="ts" setup>
import { inject, markRaw, type Raw, reactive, ref, type Ref } from "vue";
import { 探测应用类, type 探测状态类型, type 探测目标类型, 经纬度坐标类 } from "@/网络模型/应用";
import 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 导弹类 } from "@/移动单位/导弹";

const 探测应用 = inject<探测应用类>("探测应用")!;
const 探测单位 = 探测应用.单位;

const 探测目标编号映射 = 探测应用类.探测目标编号映射;
const 探测目标情报记录 = 探测应用.本单位探测目标情报记录;

type 探测情报信息类型 = {
  目标编号: number,
  目标类型: string,
  探测状态: Ref<探测状态类型>,
  坐标: Ref<经纬度坐标类>
}

function 获取探测情报信息(探测目标: 移动单位类): 探测情报信息类型 {
  const 探测情报 = 探测目标情报记录.get(探测目标)!;
  const 目标编号 = 探测目标编号映射.get(探测目标)!;
  const 目标类型 = 探测目标.名称;
  const 探测状态 = ref(探测情报.探测状态);
  const 坐标 = ref(探测情报.坐标);
  探测应用.更新位置事件.添加侦听回调((_探测目标, _坐标) => {
    if (探测目标 === _探测目标) {
      坐标.value = _坐标;
    }
  });
  探测应用.重新发现事件.添加侦听回调((_探测目标, _坐标) => {
    if (探测目标 === _探测目标) {
      探测状态.value = "跟踪中";
      坐标.value = _坐标;
    }
  });
  探测应用.丢失目标事件.添加侦听回调(_探测目标 => {
    if (探测目标 === _探测目标) {
      探测状态.value = "已丢失";
    }
  });
  return { 目标编号: 目标编号, 目标类型: 目标类型, 探测状态: 探测状态, 坐标: 坐标 };
}

const 探测目标列表 = reactive<Raw<探测目标类型>[]>([]);
const 探测情报信息映射 = new Map<Raw<探测目标类型>, 探测情报信息类型>();

const 添加探测目标回调 = (探测目标: 探测目标类型) => {
  markRaw(探测目标);
  探测目标列表.push(探测目标);
  const 探测情报信息 = 获取探测情报信息(探测目标);
  探测情报信息映射.set(探测目标, 探测情报信息);
};

for (const 探测目标 of 探测目标情报记录.keys()) {
  添加探测目标回调(探测目标);
}
探测应用.发现目标事件.添加侦听回调(添加探测目标回调);

function 确认删除(目标: 探测目标类型): void {
	new 导弹类(探测单位, 目标);
}
</script>

<style scoped>
.标签 {
    font-size: var(--el-font-size-base);
}

.容器 {
    border: 1px solid var(--el-border-color);
}

.分割线 {
    margin: 0;
    z-index: 2;
    /*border: 0;*/
    color: var(--el-text-color-regular);
}
</style>