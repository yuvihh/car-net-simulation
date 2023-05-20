<template>
	<el-tabs v-model="当前标签页名称" style="margin-top: 0" tab-position="left" type="card">
		<el-tab-pane label="基本控制" name="基本控制">
			<StatusTab :单位="单位" class="状态标签页"/>
		</el-tab-pane>
		<el-tab-pane label="网络设备" name="网络设备">
			<NetworkDevice @点击网络设备链接="打开网络设备"/>
		</el-tab-pane>
		<el-tab-pane label="网卡列表" name="网卡列表">
			<net-card-list @点击网卡链接="打开网络设备" @点击嗅探流量="嗅探网卡流量"/>
		</el-tab-pane>
		<el-tab-pane label="路由表" name="路由表">
			<RouteTab :网络层协议="单位.网络层协议"/>
		</el-tab-pane>
		<el-tab-pane label="应用列表" name="应用列表">
			<AppListTab @打开应用="打开应用"/>
		</el-tab-pane>
		<el-tab-pane label="应用菜单" name="应用菜单">
			<AppMenuTab :单位="单位"/>
		</el-tab-pane>
		<el-tab-pane v-for="标签页 of 标签页列表" :label="标签页.标签页名称" :name="标签页.标签页名称" closable>
			<component :is="标签页.组件类型" class="应用标签页" v-bind="标签页.参数"/>
		</el-tab-pane>
		<el-tab-pane v-for="网卡 of 嗅探流量网卡列表" :label="'(嗅探)' + 网络设备名称映射.get(网卡)"
								 :name="'(嗅探)' + 网络设备名称映射.get(网卡)" closable>
			<traffic-sniff :网卡="网卡"/>
		</el-tab-pane>
	</el-tabs>
</template>

<script lang="ts" setup>
import {
  type Component,
  computed,
  markRaw,
  onUnmounted,
  provide,
  ref,
  type ShallowReactive,
  shallowReactive,
  toRaw
} from "vue";

import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import StatusTab from "./状态标签页/状态标签页组件.vue";
import NetCardList from "./网卡列表/网卡列表.vue";
import RouteTab from "./路由表/路由表.vue";
import EchoClientTab from "./应用组件/回显客户端.vue";
import EchoServerTab from "./应用组件/回显服务器.vue";
import SpyController from "@/控制面板组件/移动单位/应用组件/探测应用/探测应用.vue";
import type { 应用类 } from "@/网络模型/应用";
import { 探测应用类, 回显客户端类, 回显服务器类 } from "@/网络模型/应用";
import AppListTab from "./应用组件/应用列表.vue"
import AppMenuTab from "./应用组件/应用菜单.vue"
import SdnSwitch from "@/控制面板组件/移动单位/SDN交换机/SDN交换机.vue";
import SdnController from "./SDN控制器/SDN控制器.vue";
import NetworkDevice from "@/控制面板组件/移动单位/网络设备列表.vue";
import SpmaNetCard from "@/控制面板组件/移动单位/网卡/SPMA网卡/SPMA网卡.vue";
import { 网卡基类, 网络设备类, } from "@/网络模型/网络";
import { SDN交换机类, SDN控制器类 } from "@/网络模型/sdn";
import { 应用名称映射, 获取网络设备类型名称 } from "@/配置";
import { SPMA网卡类 } from "@/网络模型/spma";
import TrafficSniff from "@/控制面板组件/移动单位/流量嗅探/流量嗅探.vue";

const { 单位 } = defineProps<{ 单位: 移动单位类 }>();
provide("单位", 单位);

const 当前标签页名称 = ref("基本控制");

const 标签页列表 = shallowReactive<{
  标签页名称: string
  组件类型: Component,
  参数: object
}[]>([]);
const 标签页名称列表 = computed(() => 标签页列表.map(标签页 => 标签页.标签页名称));

const 网络设备映射 = shallowReactive(new Map<string, ShallowReactive<Map<number, 网络设备类>>>());
const 网络设备编号映射 = shallowReactive(new Map<网络设备类, number>());
const 网络设备名称映射 = shallowReactive(new Map<网络设备类, string>());
provide("网络设备名称映射", 网络设备名称映射);

function 添加网络设备回调(网络设备: 网络设备类): void {
  const 网络设备类型名称 = 获取网络设备类型名称(网络设备);
  let 编号;
  if (网络设备映射.has(网络设备类型名称)) {
    const _网络设备编号映射 = 网络设备映射.get(网络设备类型名称)!;
    编号 = _网络设备编号映射.size > 0 ? Math.max(..._网络设备编号映射.keys()) + 1 : 0;
    _网络设备编号映射.set(编号, 网络设备);
  } else {
    编号 = 0;
    const _网络设备编号映射 = shallowReactive(new Map([[0, 网络设备]]));
    网络设备映射.set(网络设备类型名称, _网络设备编号映射);
  }
  网络设备编号映射.set(网络设备, 编号);
  const 网络设备名称 = 网络设备类型名称 + " " + 编号;
  网络设备名称映射.set(网络设备, 网络设备名称);
}

function 删除网络设备回调(网络设备: 网络设备类): void {
  const 网络设备类型名称 = 获取网络设备类型名称(网络设备);
  const _网络设备编号映射 = 网络设备映射.get(网络设备类型名称)!;
  const 网络设备编号 = 网络设备编号映射.get(网络设备)!;
  _网络设备编号映射.delete(网络设备编号);
  网络设备编号映射.delete(网络设备);
  网络设备名称映射.delete(网络设备);
}

单位.网络设备集合.forEach(添加网络设备回调);
单位.添加网络设备事件.添加侦听回调(添加网络设备回调);
单位.删除网络设备事件.添加侦听回调(删除网络设备回调);
onUnmounted(() => 单位.添加网络设备事件.移除侦听回调(添加网络设备回调));
onUnmounted(() => 单位.删除网络设备事件.移除侦听回调(删除网络设备回调));

const 应用组件映射 = new Map<typeof 应用类, Component>([
  [回显客户端类, markRaw(EchoClientTab)],
  [回显服务器类, markRaw(EchoServerTab)],
  [探测应用类, markRaw(SpyController)]
]);

function 打开应用(应用: 应用类) {
  应用 = toRaw(应用);
  const 应用类型 = <typeof 应用类>应用.constructor;
  const 应用类型名称 = 应用名称映射.getKey(应用类型)!;
  const 端口 = 应用.套接字.端口;
  const 标签页名称 = `${ 应用类型名称 }:${ 端口 }`;
  for (const 标签页 of 标签页列表) {
    if (标签页.标签页名称 === 标签页名称) {
      当前标签页名称.value = 标签页名称;
      return;
    }
  }
  标签页列表.push({
    标签页名称: 标签页名称,
    组件类型: 应用组件映射.get(应用类型)!,
    参数: Object.fromEntries([[应用类型名称, 应用]]),
  });
  当前标签页名称.value = 标签页名称;
}

const 网络设备标签页组件映射 = new Map<typeof 网络设备类, Component>([
  [SDN交换机类, SdnSwitch],
  [SDN控制器类, SdnController],
  [<typeof 网络设备类><unknown>SPMA网卡类, SpmaNetCard]
]);

const 网络设备标签页参数名称映射 = new Map<typeof 网络设备类, string>([
  [SDN交换机类, "SDN交换机"],
  [SDN控制器类, "SDN控制器"],
  [<typeof 网络设备类><unknown>SPMA网卡类, "SPMA网卡"]
]);

function 打开网络设备(网络设备: 网络设备类): void {
  const 网络设备类型 = <typeof 网络设备类>网络设备.constructor;
  if (网络设备标签页组件映射.has(网络设备类型)) {
    const 网络设备标签页组件 = 网络设备标签页组件映射.get(网络设备类型)!;
    const 标签页名称 = 网络设备名称映射.get(网络设备)!;
    if (!标签页名称列表.value.includes(标签页名称)) {
      const 参数名称 = 网络设备标签页参数名称映射.get(网络设备类型)!;
      const 参数 = { [参数名称]: 网络设备 };
      标签页列表.push({
        标签页名称: 标签页名称,
        组件类型: 网络设备标签页组件,
        参数: 参数
      });
    }
    当前标签页名称.value = 标签页名称;
  } else if (网络设备 instanceof 网卡基类) {
    当前标签页名称.value = "网卡列表";
  }
}

const 嗅探流量网卡列表 = shallowReactive<网卡基类[]>([]);

function 嗅探网卡流量(网卡: 网卡基类): void {
  if (!嗅探流量网卡列表.includes(网卡)) {
    嗅探流量网卡列表.push(网卡);
  }
  当前标签页名称.value = '(嗅探)' + 网络设备名称映射.get(网卡)!;
}
</script>

<style scoped>
.状态标签页 {
    width: 100%;
    height: 100%;
}
</style>
