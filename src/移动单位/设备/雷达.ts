import 移动单位类, { 阵营单位映射, 阵营类型 } from "@/移动单位/移动单位/移动单位";
import { Cartesian3, Color, Entity } from "cesium";
import { 地图 } from "@/地图";
import { 设备类 } from "@/移动单位/设备/设备";
import type { 探测应用类 } from "@/网络模型/应用";
import { 经纬度坐标类 } from "@/网络模型/应用";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { 事件类 } from "@/事件";

type 雷达类构造选项 = { 半径?: number };

export class 雷达类 extends 设备类 {
  static readonly 实例化事件 = new 事件类<[雷达类]>("雷达类");
  protected 实体: Entity;
  readonly 半径: number = 20000;
  
  constructor(单位: 移动单位类, 选项: 雷达类构造选项 = {}) {
    super(单位);
    const { 半径 } = 选项;
    if (半径) {
      this.半径 = 半径;
    }
    this.实体 = 地图.entities.add({
      name: "雷达",
      position: this._移动单位.实体.position,
      ellipse: {
        semiMinorAxis: this.半径,
        semiMajorAxis: this.半径,
        fill: false,
        outline: true,
        outlineColor: Color.RED
      }
    });
    this._移动单位.关联实体集合.add(this.实体);
    this._移动单位.实体.definitionChanged.addEventListener(实体 => {
      this.实体.position = 实体.position;
      this.实体.show = 实体.show;
    });
    雷达类.实例化事件.触发(this);
  }
  
  get 当前位置(): Cartesian3 {
    return this.移动单位.当前位置;
  }
}

const 己方雷达集合 = new Set<雷达类>();

雷达类.实例化事件.添加侦听回调(雷达 => {
  if (雷达.移动单位.阵营 === 阵营类型.红方) {
    己方雷达集合.add(雷达);
  }
});

const 干扰方单位暴露状态映射 = new Map<移动单位类, boolean>();

function 判断是否暴露(干扰方单位: 移动单位类): boolean {
  const 干扰方位置 = 干扰方单位.当前位置;
  for (const 己方雷达 of 己方雷达集合) {
    const 距离 = Cartesian3.distance(干扰方位置, 己方雷达.当前位置);
    if (距离 < 己方雷达.半径) {
      return true;
    }
  }
  return false;
}

地图.clock.onTick.addEventListener(() => {
  const 干扰方单位集合 = 阵营单位映射.get(阵营类型.蓝方)!;
  for (const 干扰方单位 of 干扰方单位集合) {
    const 暴露状态 = 判断是否暴露(干扰方单位);
    干扰方单位暴露状态映射.set(干扰方单位, 暴露状态);
    干扰方单位.实体!.show = 暴露状态;
  }
});

export class 雷达应用类 {
  static readonly 实例化事件 = new 事件类<[雷达应用类]>("雷达应用类");
  readonly 雷达: 雷达类;
  readonly 探测应用: 探测应用类;
  readonly 探测间隔: number;
  readonly 探测目标坐标映射 = new Map<移动单位类, 经纬度坐标类>();
  
  constructor(雷达: 雷达类, 探测应用: 探测应用类, 探测间隔: number) {
    this.雷达 = 雷达;
    this.探测应用 = 探测应用;
    this.探测间隔 = 探测间隔;
    离散事件仿真器.设置间隔事件(探测间隔, () => this.探测());
    雷达应用类.实例化事件.触发(this);
  }
  
  protected 探测(): void {
    const 干扰方单位集合 = 阵营单位映射.get(阵营类型.蓝方)!;
    for (const 干扰方单位 of 干扰方单位集合) {
      const 干扰方位置 = 干扰方单位.当前位置;
      const 距离 = Cartesian3.distance(干扰方位置, this.雷达.当前位置);
      if (距离 < this.雷达.半径) {
        const { 经度, 纬度 } = 干扰方单位.当前经纬度坐标;
        const 经纬度坐标 = new 经纬度坐标类(经度, 纬度, 10000);
        if (this.探测目标坐标映射.has(干扰方单位)) {
          const 上次探测坐标 = this.探测目标坐标映射.get(干扰方单位)!;
          if (上次探测坐标.等于(经纬度坐标)) {
            break;
          }
        }
        this.探测应用.探测目标(干扰方单位, 经纬度坐标);
        this.探测目标坐标映射.set(干扰方单位, 经纬度坐标);
      } else if (this.探测目标坐标映射.has(干扰方单位)) {
        this.探测应用.丢失目标(干扰方单位);
        this.探测目标坐标映射.delete(干扰方单位);
      }
    }
  }
}
