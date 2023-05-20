import { 设备类 } from "@/移动单位/设备/设备";
import { Cartesian3, Color, Entity } from "cesium";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 阵营单位映射, 阵营类型 } from "@/移动单位/移动单位/移动单位";
import { 地图 } from "@/地图";
import { 网卡基类, 频道基类 } from "@/网络模型/网络";
import { 事件类 } from "@/事件";

type 干扰源构造选项 = { 半径?: number };

export class 干扰源类 extends 设备类 {
  static readonly 实例化事件 = new 事件类<[干扰源类]>("干扰机类");
  readonly 半径: number = 5000;
  protected 实体: Entity;
  protected 干扰网卡频道映射 = new Map<网卡基类, 频道基类>();
  protected 干扰方阵营: 阵营类型;
  
  constructor(移动单位: 移动单位类, 选项: 干扰源构造选项 = {}) {
    super(移动单位);
    const { 半径 } = 选项;
    if (半径) {
      this.半径 = 半径;
    }
    this.实体 = this.生成实体();
    this._移动单位.关联实体集合.add(this.实体);
    this.干扰方阵营 = 移动单位.阵营 === 阵营类型.红方 ? 阵营类型.蓝方 : 阵营类型.红方;
    地图.clock.onTick.addEventListener(() => this.干扰());
    干扰源类.实例化事件.触发(this);
  }
  
  get 当前位置(): Cartesian3 {
    return this.移动单位.当前位置;
  }
  
  get 干扰方单位集合(): Set<移动单位类> {
    const 干扰方单位集合 = new Set<移动单位类>();
    const 干扰方单位集合_ = 阵营单位映射.get(this.干扰方阵营)!;
    干扰方单位集合_.forEach(干扰方单位 => {
      const 距离 = Cartesian3.distance(干扰方单位.当前位置, this.当前位置);
      if (距离 < this.半径) {
        干扰方单位集合.add(干扰方单位);
      }
    });
    return 干扰方单位集合;
  }
  
  生成实体(): Entity {
    const 实体 = 地图.entities.add({
      name: "干扰机",
      position: this._移动单位.实体.position,
      ellipse: {
        semiMinorAxis: this.半径,
        semiMajorAxis: this.半径,
        fill: false,
        outline: true,
        outlineColor: Color.YELLOW
      },
      show: this._移动单位.实体.show
    });
    this._移动单位.实体.definitionChanged.addEventListener(_实体 => {
      实体.position = _实体.position;
      实体.show = _实体.show;
    });
    return 实体;
  }
  
  干扰(): void {
    const 干扰方单位集合 = 阵营单位映射.get(this.干扰方阵营)!;
    for (const 干扰方单位 of 干扰方单位集合) {
      const 距离 = Cartesian3.distance(干扰方单位.当前位置, this.当前位置);
      if (距离 < this.半径) {
        for (const 网络设备 of 干扰方单位.网络设备集合) {
          if (网络设备 instanceof 网卡基类) {
            const 网卡 = 网络设备;
            const 频道 = 网络设备.频道;
            if (频道) {
              this.干扰网卡频道映射.set(网卡, 频道);
              频道.退出网卡(网卡);
            }
          }
        }
      } else {
        for (const 网络设备 of 干扰方单位.网络设备集合) {
          if (网络设备 instanceof 网卡基类 && this.干扰网卡频道映射.has(网络设备)) {
            const 网卡 = 网络设备;
            const 频道 = this.干扰网卡频道映射.get(网卡)!;
            频道.加入网卡(网卡);
            this.干扰网卡频道映射.delete(网卡);
          }
        }
      }
    }
  }
}