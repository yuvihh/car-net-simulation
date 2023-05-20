<template>
	<el-divider class="顶部分割线"/>
	<el-table :data="网卡表格" class="网卡列表" height="800" highlight-current-row @current-change="选择网卡">
		<template #empty>
			<el-button size="large" @click="新建网卡">新建网卡</el-button>
		</template>
		<el-table-column type="expand" width="20">
			<template #default="scope">
				<InterfaceList :网卡="toRaw(scope.row.网卡)" @点击新建网络按钮="打开新建网络接口对话框(scope.row.网卡)"/>
			</template>
		</el-table-column>
		<el-table-column label="名称" width="65">
			<template #default="scope">
				<el-link @click="$emit('点击网卡链接', scope.row.网卡)">{{ scope.row.名称 }}</el-link>
			</template>
		</el-table-column>
		<el-table-column align="center" label="MAC" prop="MAC地址" width="140"/>
		<el-table-column align="center" label="网卡类型" width="85">
			<template #default="scope">
				<el-tag size="large">{{ scope.row.类型 }}</el-tag>
			</template>
		</el-table-column>
		<el-table-column align="center" label="传输速率 (字节/秒)" width="175">
			<template #default="scope">
				<el-input-number v-model="scope.row.传输速率" size="default"/>
			</template>
		</el-table-column>
		<el-table-column align="center" label="频道">
			<template #default="scope">
				<el-link v-if="scope.row.频道名称">{{ scope.row.频道名称 }}</el-link>
				<el-button v-else @click="打开加入频道对话框(scope.row.网卡)">加入频道</el-button>
			</template>
		</el-table-column>
	</el-table>
	<el-button class="按钮" size="default" @click="新建网卡">
		<el-icon :size="18">
			<Plus/>
		</el-icon>
	</el-button>
	<el-button :disabled="禁用删除网卡按钮" class="按钮" @click="删除网卡">
		<el-icon :size="18">
			<Minus/>
		</el-icon>
	</el-button>
	<el-tooltip content="嗅探流量" :show-after="700">
		<el-button class="按钮" :disabled="禁用嗅探流量按钮" @click="$emit('点击嗅探流量', 当前选择网卡)">
			<el-icon :size="20">
				<View/>
			</el-icon>
		</el-button>
	</el-tooltip>
	<el-divider class="底部分割线"></el-divider>
	<el-dialog v-model="新建网卡对话框可见" :draggable="true" :modal="false" destroy-on-close title="新建网卡"
						 width="360px" @closed="关闭新建网卡对话框">
		<el-form :model="新建网卡表单">
			<el-form-item label="网卡类型">
				<el-select v-model="新建网卡表单.网卡类型" class="新建网卡对话框项目">
					<el-option v-for="网卡类型 in 网卡类型映射.keys()" :key="网卡类型" :label="网卡类型" :value="网卡类型"/>
				</el-select>
			</el-form-item>
			<el-form-item label="传输速率">
				<el-input-number v-model="新建网卡表单.传输速率" class="新建网卡对话框项目"/>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button type="primary" @click="确认新建网卡">
				确认
			</el-button>
			<el-button @click="取消新建网卡">取消</el-button>
		</template>
	</el-dialog>
	<JoinChannelDialog v-model="加入频道对话框可见" :网卡="加入频道网卡"/>
	<NewInterfaceDialog v-model="新建网络接口对话框可见" :网卡="新建网络接口网卡"/>
</template>

<script lang="ts" setup>
import {
  computed,
  inject,
  markRaw,
  onUnmounted,
  type Raw,
  ref,
  type Ref,
  shallowReactive,
  type ShallowReactive,
  shallowRef,
  toRaw,
  watch
} from "vue";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 网卡基类, 网卡类, 网络设备类, 频道基类 } from "@/网络模型/网络";
import { Minus, Plus, View } from "@element-plus/icons-vue";
import { TDMA网卡类 } from "@/网络模型/tdma";
import BiMap from "bidirect-map";
import { 频道类型名称映射 } from "@/配置";
import { 频道编号映射 } from "@/状态/状态";
import JoinChannelDialog from "./加入频道对话框.vue";
import InterfaceList from "./网络接口列表.vue";
import NewInterfaceDialog from "./新建网络接口对话框.vue";
import { SPMA网卡类 } from "@/网络模型/spma";
import { 侦听实例化完成事件 } from "@/事件";

defineEmits<{
  (e: "点击网卡链接", 网卡: 网卡基类): void,
  (e: "点击嗅探流量", 网卡: 网卡基类): void
}>();

const 单位 = inject<移动单位类>("单位")!;
const 网络设备名称映射 = inject<Map<网络设备类, string>>("网络设备名称映射")!;

interface 网卡信息类型 {
  名称: string,
  MAC地址: string,
  类型: string,
  传输速率: Ref<number>,
  频道名称: Ref<string | null>,
}

const 网卡信息映射 = shallowReactive(new Map<网卡基类, ShallowReactive<网卡信息类型>>());

interface 网卡表格行类型 extends 网卡信息类型 {
  网卡: Raw<网卡基类>
}

const 网卡表格 = computed(() => {
  const _网卡表格: 网卡表格行类型[] = [];
  for (const [网卡, 网卡信息] of 网卡信息映射) {
    markRaw(网卡);
    const 网卡表格行 = { 网卡: 网卡, ...网卡信息 };
    _网卡表格.push(网卡表格行);
  }
  return _网卡表格;
});

const 网卡类型映射 = new BiMap<string, typeof 网卡基类>({
  "CSMA": 网卡类,
  "TDMA": TDMA网卡类,
  "SPMA": SPMA网卡类
});

function 获取网卡信息(网卡: 网卡基类): 网卡信息类型 {
  return <网卡信息类型>{
    名称: 网络设备名称映射.get(网卡),
    MAC地址: 网卡.MAC地址,
    类型: 网卡类型映射.getKey(<typeof 网卡基类>网卡.constructor),
    传输速率: ref(网卡.传输速率),
    频道名称: ref(获取频道名称(网卡.频道))
  };
}

function 获取频道名称(频道: 频道基类 | null): string | null {
  return 频道 ? 频道类型名称映射.get(<typeof 频道基类>频道.constructor)! + " " + 频道编号映射.get(频道) : null;
}

const 设置传输速率回调映射 = new Map<网卡基类, (...args: any[]) => void>();
const 设置频道回调映射 = new Map<网卡基类, (...args: any[]) => void>();
const 添加网络设备回调 = (网络设备: 网络设备类): void => {
  if (网络设备 instanceof 网卡基类) {
    const 网卡 = 网络设备;
    if (网卡.MAC地址) {
      const 网卡信息 = 获取网卡信息(网卡);
      网卡信息映射.set(网卡, 网卡信息);
      watch(网卡信息.传输速率, (新传输速率, 旧传输速率) => {
        if (新传输速率 !== 旧传输速率) {
          网卡.传输速率 = 新传输速率;
        }
      });
    } else {
      侦听实例化完成事件(网卡, () => {
        const 网卡信息 = 获取网卡信息(网卡);
        网卡信息映射.set(网卡, 网卡信息);
        watch(网卡信息.传输速率, (新传输速率, 旧传输速率) => {
          if (新传输速率 !== 旧传输速率) {
            网卡.传输速率 = 新传输速率;
          }
        });
      });

    }

    const 设置传输速率回调 = (传输速率: number) => {
      if (网卡信息映射.get(网卡)!.传输速率.value !== 传输速率) {
        网卡信息映射.get(网卡)!.传输速率.value = 传输速率;
      }
    };
    网卡.设置传输速率事件.添加侦听回调(设置传输速率回调);
    设置传输速率回调映射.set(网卡, 设置传输速率回调);

    const 设置频道回调 = () => {
      网卡信息映射.get(网卡)!.频道名称.value = 获取频道名称(网卡.频道);
    };
    网卡.设置频道事件.添加侦听回调(设置频道回调);
    设置频道回调映射.set(网卡, 设置频道回调);
  }
};
const 删除网络设备回调 = (网络设备: 网络设备类) => {
  if (网络设备 instanceof 网卡基类) {
    const 网卡 = 网络设备;
    网卡信息映射.delete(网卡);

    const 设置传输速率回调 = 设置传输速率回调映射.get(网卡)!;
    网卡.设置传输速率事件.移除侦听回调(设置传输速率回调);
    设置传输速率回调映射.delete(网卡);

    const 设置频道回调 = 设置频道回调映射.get(网卡)!;
    网卡.设置频道事件.移除侦听回调(设置频道回调);
    设置频道回调映射.delete(网卡);
  }
};
单位.网络设备集合.forEach(添加网络设备回调);
单位.添加网络设备事件.添加侦听回调(添加网络设备回调);
单位.删除网络设备事件.添加侦听回调(删除网络设备回调);
onUnmounted(() => 单位.添加网络设备事件.移除侦听回调(添加网络设备回调));
onUnmounted(() => 单位.删除网络设备事件.移除侦听回调(删除网络设备回调));

let 当前选择网卡 = shallowRef<网卡基类>();

const 新建网卡对话框可见 = shallowRef(false);
type 新建网卡表单类型 = {
  网卡类型: string,
  传输速率: number,
}
const 默认网卡类型 = 网卡类型映射.keys().next().value;
const 默认速率 = 1e6;
const 新建网卡表单 = shallowReactive<新建网卡表单类型>({
  网卡类型: 默认网卡类型,
  传输速率: 默认速率,
});

function 新建网卡() {
  新建网卡对话框可见.value = true;
}

function 确认新建网卡(): void {
  const 网卡类型 = <new (...args: any) => 网卡基类><unknown>网卡类型映射.get(新建网卡表单.网卡类型)!;
  new 网卡类型(单位, 新建网卡表单.传输速率);
  新建网卡对话框可见.value = false;
}

function 取消新建网卡() {
  新建网卡对话框可见.value = false;
}

function 关闭新建网卡对话框() {
  新建网卡表单.网卡类型 = 默认网卡类型;
  新建网卡表单.传输速率 = 默认速率;
}

function 选择网卡(网卡表格行: 网卡表格行类型): void {
  if (网卡表格行) {
    当前选择网卡.value = toRaw(网卡表格行.网卡);
  } else {
    当前选择网卡.value = undefined;
  }
}

const 禁用删除网卡按钮 = computed(() => {
  return 当前选择网卡.value === undefined;
});

function 删除网卡(): void {
  if (当前选择网卡.value instanceof 网卡基类) {
    单位.删除网络设备(当前选择网卡.value);
    当前选择网卡.value = undefined;
  }
}

const 加入频道网卡 = shallowRef<网卡基类>();
const 加入频道对话框可见 = ref(false);

function 打开加入频道对话框(网卡: 网卡基类): void {
  加入频道网卡.value = toRaw(网卡);
  加入频道对话框可见.value = true;
}

let 新建网络接口网卡 = shallowRef<网卡基类>();
const 新建网络接口对话框可见 = ref(false);

function 打开新建网络接口对话框(网卡: 网卡基类): void {
  新建网络接口网卡.value = toRaw(网卡);
  新建网络接口对话框可见.value = true;
}

function 打开网卡(网卡: 网卡基类): void {

}

const 禁用嗅探流量按钮 = computed(() => !当前选择网卡.value);
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

.网卡列表 {
    width: 100%;
    margin: 0;
    padding: 0;
}

.新建网卡对话框项目 {
    width: 100%;
}
</style>
