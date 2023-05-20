<template>
	<div class="容器">
		<el-divider class="分割线" content-position="left" border-style="hidden">组探测情报</el-divider>
		<el-table :data="探测组员列表" height="350px">
			<el-table-column type="expand">
				<template #default="scope">
					<spy-info-table :探测组员="scope.row"/>
				</template>
			</el-table-column>
			<el-table-column label="探测单位" width="80" align="center">
				<template #default="scope">
					{{ 探测组员信息映射.get(scope.row).探测单位名称 }}
				</template>
			</el-table-column>
			<el-table-column label="跟踪目标" width="80" align="center">
				<template #default="scope">
					{{ 探测组员信息映射.get(scope.row).跟踪目标数量 }}
				</template>
			</el-table-column>
			<el-table-column label="探测目标" width="80" align="center">
				<template #default="scope">
					{{ 探测组员信息映射.get(scope.row).探测目标数量 }}
				</template>
			</el-table-column>
			<el-table-column label="坐标" align="center">
				<template #default="scope">
					{{ 探测组员信息映射.get(scope.row).坐标.value }}
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script lang="ts" setup>
import { inject, markRaw, provide, ref, type Ref, type ShallowReactive, shallowReactive } from "vue";
import { 探测应用类, 经纬度坐标类 } from "@/网络模型/应用";
import SpyInfoTable from "@/控制面板组件/移动单位/应用组件/探测应用/探测组情报列表/探测情报信息表格.vue";
import 移动单位类 from "@/移动单位/移动单位/移动单位";

const 探测应用 = inject<探测应用类>("探测应用")!;

const 探测目标编号映射 = 探测应用类.探测目标编号映射;
const 探测组员列表 = [...探测应用.探测组员集合];
探测组员列表.forEach(markRaw);

type 探测组员信息类型 = {
  探测单位名称: string,
  跟踪目标数量: Ref<number>,
  探测目标数量: Ref<number>,
  坐标: Ref<经纬度坐标类>,
};

function 获取探测组员信息(探测组员: 探测应用类): 探测组员信息类型 {
  const 探测单位 = 探测组员.单位;
  const 探测单位名称 = 探测单位.单位名称!;
  const 跟踪目标数量 = ref(探测组员.已跟踪目标集合.size);
  const 探测目标数量 = ref(探测组员.本单位探测目标情报记录.size);
  探测应用.更新发现目标情报事件.添加侦听回调(探测者 => {
    if (探测者 === 探测单位) {
      跟踪目标数量.value += 1;
      探测目标数量.value += 1;
    }
  });
  探测应用.更新丢失目标情报事件.添加侦听回调(探测者 => {
    if (探测者 === 探测单位) {
      跟踪目标数量.value += 1;
		}
	});
  探测应用.更新重新发现情报事件.添加侦听回调(探测者 => {
    if (探测者 === 探测单位) {
      跟踪目标数量.value += 1;
		}
	});
  const 坐标 = ref(探测单位.当前经纬度坐标);
  setInterval(() => {
    const 当前经纬度坐标 = 探测单位.当前经纬度坐标;
    if (!坐标.value.等于(当前经纬度坐标)) {
      坐标.value = 当前经纬度坐标;
    }
  }, 100);
  return {
    探测单位名称: 探测单位名称,
    跟踪目标数量: 跟踪目标数量,
    探测目标数量: 探测目标数量,
    坐标: 坐标,
  }
}

type 探测情报信息类型 = {
  目标编号: number,
  目标类型: string,
  探测状态: Ref<"跟踪中" | "已丢失">,
  坐标: Ref<经纬度坐标类>
}

function 获取探测情报信息(探测单位: 移动单位类, 探测目标: 移动单位类): 探测情报信息类型 {
  const 目标编号 = 探测目标编号映射.get(探测目标)!;
  const 目标类型 = 探测目标.名称;
  const 探测情报 = 探测应用.探测情报记录.get(探测单位)!.get(探测目标)!;
  const 探测状态 = ref(探测情报.探测状态);
  const 坐标 = ref(探测情报.坐标);
  探测应用.更新更新位置情报事件.添加侦听回调((探测者, _探测目标, _坐标) => {
    if (探测者 === 探测单位 && _探测目标 === 探测目标) {
      坐标.value = _坐标;
    }
  });
  探测应用.更新重新发现情报事件.添加侦听回调((探测者, _探测目标) => {
    if (探测者 === 探测单位 && _探测目标 === 探测目标) {
      探测状态.value = "跟踪中";
    }
  });
  探测应用.更新丢失目标情报事件.添加侦听回调((探测者, _探测目标) => {
    if (探测者 === 探测单位 && _探测目标 === 探测目标) {
      探测状态.value = "已丢失";
    }
  });
  setInterval(() => {
    const 当前坐标 = 探测情报.坐标;
    if (!坐标.value.等于(当前坐标)) {
      坐标.value = 当前坐标;
		}
	}, 100);
  return {
    目标编号: 目标编号,
    目标类型: 目标类型,
    探测状态: 探测状态,
    坐标: 坐标
  }
}

function 获取探测情报信息映射(_探测应用: 探测应用类): ShallowReactive<Map<移动单位类, 探测情报信息类型>> {
  const 探测情报信息映射 = new Map<移动单位类, 探测情报信息类型>();
  const 探测单位 = _探测应用.单位;
  const 探测情报记录 = 探测应用.探测情报记录.get(探测单位)!;
  for (const 探测目标 of 探测情报记录.keys()) {
    markRaw(探测目标);
    const 探测情报信息 = 获取探测情报信息(探测单位, 探测目标);
    探测情报信息映射.set(探测目标, 探测情报信息);
  }
  探测应用.更新发现目标情报事件.添加侦听回调((_探测单位, _探测目标, _坐标) => {
    if (_探测单位 === 探测单位) {
      markRaw(_探测目标);
      const 探测情报信息 = 获取探测情报信息(探测单位, _探测目标);
      探测情报信息映射.set(_探测目标, 探测情报信息);
    }
  });
  return 探测情报信息映射;
}

function 获取探测目标列表(探测组员: 探测应用类): ShallowReactive<移动单位类[]> {
  const 探测单位 = 探测组员.单位;
  const 探测情报记录 = 探测应用.探测情报记录.get(探测单位)!;
  const 探测目标列表 = shallowReactive<移动单位类[]>([]);
  for (const 探测目标 of 探测情报记录.keys()) {
    探测目标列表.push(探测目标);
  }
  探测应用.更新发现目标情报事件.添加侦听回调((_探测单位, _探测目标, _坐标) => {
    if (_探测单位 === 探测单位) {
      探测目标列表.push(_探测目标);
    }
  });
  return 探测目标列表;
}

const 探测组员信息映射 = new Map<探测应用类, 探测组员信息类型>();
const 探测组员探测情报信息映射 = new Map<移动单位类, Map<移动单位类, 探测情报信息类型>>();
const 探测单位探测目标列表映射 = new Map<移动单位类, ShallowReactive<移动单位类[]>>();
provide("探测组员探测情报信息映射", 探测组员探测情报信息映射);
provide("探测单位探测目标列表映射", 探测单位探测目标列表映射);
探测组员列表.map(探测组员 => {
  markRaw(探测组员);
  const 探测组员信息 = 获取探测组员信息(探测组员);
  探测组员信息映射.set(探测组员, 探测组员信息);
  const 探测单位 = 探测组员.单位;
  const 探测情报信息映射 = 获取探测情报信息映射(探测组员);
  探测组员探测情报信息映射.set(探测单位, 探测情报信息映射);
  const 探测目标列表 = 获取探测目标列表(探测组员);
  探测单位探测目标列表映射.set(探测单位, 探测目标列表);
});
</script>

<style scoped>
.容器 {
    border: 1px solid var(--el-border-color);
}

.分割线 {
    margin: 0;
    z-index: 2;
    color: var(--el-text-color-regular);
}
</style>