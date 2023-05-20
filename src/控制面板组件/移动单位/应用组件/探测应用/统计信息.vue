<template>
	<div class="统计卡片容器">
		<el-row :gutter="10" class="布局行">
			<el-col :span="8" class="布局列">
				<div class="统计卡片">
					<el-statistic :value="跟踪目标数量" align="center" title="跟踪目标数量"/>
					<div class="统计卡片页脚">
						探测目标数量 {{ 探测目标数量 }}
					</div>
				</div>
			</el-col>
			<el-col :span="8" class="布局列">
				<div class="统计卡片">
					<el-statistic :value="探测组跟踪目标数量" align="center" title="探测组跟踪目标数量"/>
					<div class="统计卡片页脚">
						探测目标数量 {{ 探测组探测目标数量 }}
					</div>
				</div>
			</el-col>
			<el-col :span="8" class="布局列">
				<div class="统计卡片">
					<el-statistic :value="探测组单位数量" align="center" title="探测组单位数量"/>
				</div>
			</el-col>
		</el-row>
	</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, shallowReactive } from "vue";
import { 探测应用类, type 探测目标类型 } from "@/网络模型/应用";

const 探测应用 = inject<探测应用类>("探测应用")!;

const 探测组员集合 = 探测应用.探测组员集合;
const 探测情报记录 = 探测应用.探测情报记录;

const 探测目标数量 = ref(0);
const 跟踪目标数量 = ref(0);
const 探测组跟踪目标集合 = shallowReactive(new Set<探测目标类型>());
const 探测组探测目标数量 = ref(探测应用类.探测目标编号映射.size);
const 探测组跟踪目标数量 = computed(() => 探测组跟踪目标集合.size);
const 探测组单位数量 = ref(探测组员集合.size + 1);

探测应用.发现目标事件.添加侦听回调(目标 => {
  跟踪目标数量.value += 1;
  探测目标数量.value += 1;
  探测组跟踪目标集合.add(目标);
  探测组探测目标数量.value = 探测应用类.探测目标编号映射.size;
});
探测应用.重新发现事件.添加侦听回调(() => {
  跟踪目标数量.value += 1;
  探测组探测目标数量.value = 探测应用类.探测目标编号映射.size;
});
探测应用.丢失目标事件.添加侦听回调(目标 => {
  跟踪目标数量.value -= 1;
  for (const 探测组员 of 探测组员集合) {
    if (探测组员.已跟踪目标集合.has(目标)) {
      return;
    }
  }
  探测组跟踪目标集合.delete(目标);
});

探测组员集合.forEach(探测组员 => {
  探测组员.已跟踪目标集合.forEach(目标 => 探测组跟踪目标集合.add(目标));
  探测组员.发现目标事件.添加侦听回调(目标 => {
    探测组探测目标数量.value = 探测应用类.探测目标编号映射.size;
    探测组跟踪目标集合.add(目标);
	});
  探测组员.重新发现事件.添加侦听回调(目标 => 探测组跟踪目标集合.add(目标));
  探测组员.丢失目标事件.添加侦听回调(目标 => {
    if (!探测应用.已跟踪目标集合.has(目标)) {
      for (const 探测组员 of 探测组员集合) {
        if (探测组员.已跟踪目标集合.has(目标)) {
          return;
        }
      }
      探测组跟踪目标集合.delete(目标);
    }
	});
});
</script>

<style scoped>
.统计卡片容器 {
    display: flex;
}

.布局行 {
    flex: auto;
}

.布局列 {
    display: flex;
}

.统计卡片 {
    padding-top: 10px;
    padding-bottom: 10px;
    border-radius: 4px;
    background-color: var(--el-bg-color-overlay);
    flex: auto;
}

.统计卡片页脚 {
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-top: 10px;
}
</style>