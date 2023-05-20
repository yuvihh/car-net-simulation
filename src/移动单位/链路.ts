import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 网卡基类, 频道基类 } from "@/网络模型/网络";
import { 地图 } from "@/地图";
import { CallbackProperty, Entity, PolylineGraphics } from "cesium";
import { 频道名称映射 } from "@/状态/状态";
import { without } from "lodash";

function 绘制链路(起点: 移动单位类, 终点: 移动单位类, 名称: string): Entity {
  const 回调属性 = new CallbackProperty(() => {
    const 起点坐标 = 起点.当前位置;
    const 终点坐标 = 终点.当前位置;
    return [起点坐标, 终点坐标];
  }, false);
  const 连接线 = new PolylineGraphics({
    positions: 回调属性
  });
  return 地图.entities.add({
    name: 名称,
    polyline: 连接线
  });
}

const 链路实体映射 = new Map<网卡基类, Map<网卡基类, Entity>>();

频道基类.实例化事件.添加侦听回调(频道 => {
  const 频道名称 = 频道名称映射.get(频道)!;
  频道.加入网卡事件.添加侦听回调(网卡 => {
    let 网卡链路实体映射 = 链路实体映射.get(网卡);
    if (网卡链路实体映射 === undefined) {
      网卡链路实体映射 = new Map<网卡基类, Entity>();
      链路实体映射.set(网卡, 网卡链路实体映射);
    }
    const 移动单位 = <移动单位类>网卡.节点;
    const 对端网卡列表 = without(频道.网卡列表, 网卡);
    for (const 对端网卡 of 对端网卡列表) {
      const 相邻单位 = <移动单位类>对端网卡.节点;
      const 链路实体 = 绘制链路(移动单位, 相邻单位, 频道名称);
      网卡链路实体映射.set(对端网卡, 链路实体);
      链路实体映射.get(对端网卡)!.set(网卡, 链路实体);
    }
  });
  频道.退出网卡事件.添加侦听回调(网卡 => {
    const 网卡链路实体映射 = 链路实体映射.get(网卡)!;
    for (const [对端网卡, 链路实体] of 网卡链路实体映射) {
      地图.entities.remove(链路实体);
      网卡链路实体映射.delete(对端网卡);
      const 对端网卡链路实体映射 = 链路实体映射.get(对端网卡)!;
      对端网卡链路实体映射.delete(网卡);
    }
  });
});
