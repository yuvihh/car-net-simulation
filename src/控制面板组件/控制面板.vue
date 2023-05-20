<template>
	<el-tabs v-model="当前标签页单位名称" type="card" @tab-remove="删除标签页">
		<el-tab-pane class="标签页" label="首页" name="首页">
			<home/>
		</el-tab-pane>
		<el-tab-pane v-for="单位 of 单位列表" class="标签页" :label="单位.单位名称" :name="单位.单位名称"
								 closable>
			<unit :单位="单位"/>
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts">
import { ref, shallowReactive } from "vue";
import Home from "@/控制面板组件/首页.vue";
import Unit from "@/控制面板组件/移动单位/移动单位.vue";
import { 地图 } from "@/地图";
import 移动单位类 from "@/移动单位/移动单位/移动单位";
import { Entity } from "cesium";

const 当前标签页单位名称 = ref("首页");
const 单位列表 = shallowReactive(new Array<移动单位类>());
const 实体映射 = new Map<Entity, 移动单位类>();
const 名称映射 = new Map<string, 移动单位类>();

地图.selectedEntityChanged.addEventListener(() => {
  if (地图.selectedEntity instanceof Entity) {
    const 当前选择实体 = 地图.selectedEntity;
    let 单位 = 实体映射.get(当前选择实体);
    if (typeof 单位 === "undefined") {
      单位 = <移动单位类>移动单位类.实体映射.get(当前选择实体);
      实体映射.set(当前选择实体, 单位);
      名称映射.set(<string>单位.单位名称, 单位);
      单位列表.push(单位);
    }
    当前标签页单位名称.value = <string>单位.单位名称;
  }
});

function 删除标签页(单位名称: string) {
  const 单位 = 名称映射.get(单位名称)!;
  const 单位序号 = 单位列表.indexOf(单位);
  if (当前标签页单位名称.value === 单位名称) {
    当前标签页单位名称.value = 单位序号 < 单位列表.length - 1 ?
      单位列表[单位序号 + 1].单位名称! :
      单位列表[单位序号 - 1].单位名称!;
  }
  单位列表.splice(单位序号, 1);
  实体映射.delete(单位.实体!);
  名称映射.delete(单位.名称);
}
</script>

<style scoped>
.标签页 {
    margin-top: 0;
    padding: 0 10px 0 0;
    z-index: 10;
}
</style>
