import { SDN控制器类 } from "@/网络模型/sdn";
import { 网卡基类, 网络设备类, 节点类, 频道基类 } from "@/网络模型/网络";
import { type ShallowReactive, shallowReactive } from "vue";
import { 获取新编号 } from "@/实用程序";
import { 频道类型名称映射 } from "@/配置";

export const 节点编号映射 = new Map<节点类, number>();
节点类.实例化事件.添加侦听回调((节点: 节点类) => {
  const 编号 = 获取新编号(节点编号映射);
  节点编号映射.set(节点, 编号);
});

export const 频道编号映射 = new Map<频道基类, number>();
export const 频道名称映射 = new Map<频道基类, string>();
export const 频道类型编号映射 = new Map<typeof 频道基类, Map<频道基类, number>>();
频道基类.实例化事件.添加侦听回调((频道: 频道基类) => {
  const 频道类型 = <typeof 频道基类>频道.constructor;
  let 同类型频道编号映射 = 频道类型编号映射.get(频道类型);
  let 编号 = 0;
  if (同类型频道编号映射 === undefined) {
    同类型频道编号映射 = new Map();
    频道类型编号映射.set(频道类型, 同类型频道编号映射);
  } else {
    编号 = 获取新编号(同类型频道编号映射);
  }
  同类型频道编号映射.set(频道, 编号);
  频道编号映射.set(频道, 编号);
  
  const 频道类型名称 = 频道类型名称映射.get(频道类型)!;
  const 频道名称 = 频道类型名称 + 编号;
  频道名称映射.set(频道, 频道名称);
});

export const MAC地址映射 = new Map<string, 网卡基类>();
网卡基类.实例化事件.添加侦听回调((网卡: 网卡基类) => {
  MAC地址映射.set(网卡.MAC地址, 网卡);
});

export const SDN控制器编号映射 = shallowReactive(new Map<SDN控制器类, number>());
SDN控制器类.实例化事件.添加侦听回调((控制器: SDN控制器类) => {
  let 编号 = 0;
  if (SDN控制器编号映射.size > 0) {
    编号 = 获取新编号(SDN控制器编号映射);
  }
  SDN控制器编号映射.set(控制器, 编号);
});

export const 节点网络设备类型编号映射 = shallowReactive(new Map<节点类, Map<typeof 网络设备类, ShallowReactive<Map<网络设备类, number>>>>());

节点类.实例化事件.添加侦听回调((节点: 节点类) => {
  const 网络设备类型编号映射 = new Map<typeof 网络设备类, ShallowReactive<Map<网络设备类, number>>>();
  节点网络设备类型编号映射.set(节点, 网络设备类型编号映射);
  节点.添加网络设备事件.添加侦听回调(网络设备 => {
    const 网络设备类型 = <typeof 网络设备类>网络设备.constructor;
    let 网络设备编号映射 = 网络设备类型编号映射.get(网络设备类型);
    if (网络设备编号映射 === undefined) {
      网络设备编号映射 = shallowReactive(new Map<网络设备类, number>);
      网络设备类型编号映射.set(网络设备类型, 网络设备编号映射);
    }
    const 编号 = 网络设备编号映射.size > 0 ? 获取新编号(网络设备编号映射) : 0;
    网络设备编号映射.set(网络设备, 编号);
  });
  节点.删除网络设备事件.添加侦听回调(网络设备 => {
    const 网络设备类型 = <typeof 网络设备类>网络设备.constructor;
    const 网络设备编号映射 = 网络设备类型编号映射.get(网络设备类型)!;
    网络设备编号映射.delete(网络设备);
  });
});
