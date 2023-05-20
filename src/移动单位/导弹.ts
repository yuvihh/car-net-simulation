import {
  Cartesian3,
  ConstantPositionProperty,
  Entity,
  ExtrapolationType,
  JulianDate,
  SampledPositionProperty
} from "cesium";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { 地图 } from "@/地图";
import { 设备类 } from "@/移动单位/设备/设备";
import 导弹图标 from "./黄色圆.png";

export class 导弹类 extends 设备类 {
  readonly 目标单位: 移动单位类;
  readonly 速度: number;
  protected 实体: Entity;
  
  constructor(移动单位: 移动单位类, 目标单位: 移动单位类, 速度: number = 20000) {
    super(移动单位);
    this.目标单位 = 目标单位;
    this.速度 = 速度;
    this.实体 = this.生成实体();
    this.设置自动导航(目标单位);
  }
  
  get 当前位置(): Cartesian3 {
    return this.实体.position!.getValue(地图.clock.currentTime)!;
  }
  
  移动到(目的位置: Cartesian3): void {
    let 位置属性: SampledPositionProperty | ConstantPositionProperty;
    const 飞行时间 = Cartesian3.distance(this.当前位置, 目的位置) / this.速度;
    const 当前时间 = 地图.clock.currentTime;
    const 到达时间 = JulianDate.addSeconds(当前时间, 飞行时间, new JulianDate());
    位置属性 = new SampledPositionProperty();
    位置属性.forwardExtrapolationType = ExtrapolationType.HOLD;
    位置属性.forwardExtrapolationType = ExtrapolationType.HOLD;
    位置属性.addSamples([当前时间, 到达时间], [this.当前位置, 目的位置]);
    this.实体.position = 位置属性;
  }
  
  设置自动导航(目标单位: 移动单位类): void {
    this.移动到(目标单位.当前位置);
    地图.clock.onTick.addEventListener(() => this.移动到(this.目标单位.当前位置));
    地图.clock.onTick.addEventListener(() => {
      if (Cartesian3.equals(this.当前位置, 目标单位.当前位置)) {
        地图.entities.remove(this.实体);
        地图.entities.remove(目标单位.实体);
        for (const 实体 of 目标单位.关联实体集合.values) {
          地图.entities.remove(实体);
        }
      }
    });
  }
  
  protected 生成实体(): Entity {
    return 地图.entities.add({
      name: "空空导弹",
      position: this._移动单位.当前位置,
      billboard: {
        image: 导弹图标,
        scale: 0.3
      },
      show: true
    });
  }
}