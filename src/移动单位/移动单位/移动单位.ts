import * as Cesium from "cesium";
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  ConstantPositionProperty,
  Entity, EntityCollection,
  ExtrapolationType,
  JulianDate,
  PinBuilder,
  SampledPositionProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType
} from "cesium";
import 无人车图片 from "./car.jpeg";
import 无人车图标 from "./car-icon.png";
import { 地图 } from "@/地图";
import { 终端类, 经纬度坐标类 } from "@/网络模型/应用";
import type { 设备类 } from "@/移动单位/设备/设备";
import { 事件类, 注册方法调用事件 } from "@/事件";

function 转换为3维坐标(屏幕坐标: Cartesian2): Cartesian3 {
  return 地图.scene.globe.pick(地图.camera.getPickRay(屏幕坐标)!, 地图.scene)!;
}

function 笛卡尔坐标转换为经纬度(笛卡尔坐标: Cartesian3): 经纬度坐标类 {
  const 经纬度坐标 = Cartographic.fromCartesian(笛卡尔坐标);
  const 经度 = Cesium.Math.toDegrees(经纬度坐标.longitude);
  const 纬度 = Cesium.Math.toDegrees(经纬度坐标.latitude);
  const 高度 = 经纬度坐标.height;
  return new 经纬度坐标类(经度, 纬度, 高度);
}

enum 熟练度类型 {
  新手 = "新手",
  老手 = "老手"
}

export enum 阵营类型 { 红方, 蓝方 }

type 移动单位类构造选项 = {
  位置?: Cartesian3,
  阵营?: 阵营类型
}

export default class 移动单位类 extends 终端类 {
  static readonly 实例化事件 = new 事件类<[移动单位类]>("移动单位类");
  static 单位数量 = 0;
  static 单位集合 = new Set<移动单位类>();
  static 实体映射: Map<Entity, 移动单位类> = new Map<Entity, 移动单位类>();
  static 阵营颜色映射 = new Map<阵营类型, Color>([
    [阵营类型.红方, Color.RED],
    [阵营类型.蓝方, Color.BLUE]
  ]);
  单位编号: number;
  单位名称: string;
  速度: number = 5000;
  名称: string = "无人车";
  图片: string = 无人车图片;
  熟练度: 熟练度类型 = 熟练度类型.老手;
  protected _实体: Entity;
  protected _关联实体集合 = new EntityCollection();
  protected _阵营 = 阵营类型.红方;
  protected _高度 = 0;
  protected _装备集合 = new Set<设备类>();
  private readonly 默认位置 = Cartesian3.fromDegrees(104, 30.7, this.高度);
  readonly 移动事件 = 注册方法调用事件(this, this.移动到);
  
  constructor(选项: 移动单位类构造选项 = {}) {
    super();
    移动单位类.单位集合.add(this);
    移动单位类.单位数量 += 1;
    this.单位编号 = 移动单位类.单位数量;
    this.单位名称 = this.名称 + " " + this.单位编号;
    
    const { 位置, 阵营 } = 选项;
    if (阵营) {
      this._阵营 = 阵营;
    }
    const 颜色 = 移动单位类.阵营颜色映射.get(this._阵营)!;
    this._实体 = 地图.entities.add({
      name: `${this.名称} ${ this.单位编号 }`,
      position: 位置 ? 位置 : this.默认位置,
      billboard: {
        image: <HTMLCanvasElement>new PinBuilder().fromUrl(无人车图标, 颜色, 36),
      }
    });
    if (this._阵营 === 阵营类型.蓝方) {
      this._实体.show = false;
    }
    (<typeof 移动单位类>this.constructor).实体映射.set(this._实体, this);
    
    new ScreenSpaceEventHandler(地图.scene.canvas).setInputAction(
      this.移动事件处理程序,
      ScreenSpaceEventType.RIGHT_CLICK,
    );
    移动单位类.实例化事件.触发(this);
  }
  
  get 实体(): Entity {
    return this._实体;
  }
  
  get 关联实体集合(): EntityCollection {
    return this._关联实体集合;
  }
  
  get 阵营(): 阵营类型 {
    return this._阵营;
  }
  
  get 高度(): number {
    return this._高度;
  }
  
  get 装备集合(): Set<设备类> {
    return this._装备集合;
  }
  
  get 当前位置(): Cartesian3 {
    return this._实体.position!.getValue(地图.clock.currentTime)!;
  }
  
  get 当前经纬度坐标(): 经纬度坐标类 {
    const 当前经纬度坐标 = 笛卡尔坐标转换为经纬度(this.当前位置);
    当前经纬度坐标.高度 = 10000;
    return 当前经纬度坐标;
  }
  
  添加设备(设备: 设备类): void {
    this._装备集合.add(设备);
  }
  
  移动到(目的位置: Cartesian3, 瞬移: boolean = false): void {
    let 位置属性: SampledPositionProperty | ConstantPositionProperty;
    if (!瞬移) {
      const 飞行时间 = Cartesian3.distance(this.当前位置, 目的位置) / this.速度;
      const 当前时间 = 地图.clock.currentTime;
      const 到达时间 = JulianDate.addSeconds(当前时间, 飞行时间, new JulianDate());
      位置属性 = new SampledPositionProperty();
      位置属性.forwardExtrapolationType = ExtrapolationType.HOLD;
      位置属性.forwardExtrapolationType = ExtrapolationType.HOLD;
      位置属性.addSamples([当前时间, 到达时间], [this.当前位置, 目的位置]);
    } else {
      位置属性 = new ConstantPositionProperty(目的位置);
    }
    this._实体.position = 位置属性;
  }
  
  protected 移动事件处理程序 = (事件: ScreenSpaceEventHandler.PositionedEvent): void => {
    if (地图.selectedEntity === this._实体) {
      const 点击坐标 = 事件.position;
      const 三维点击坐标 = 转换为3维坐标(点击坐标);
      const 经纬度坐标 = 笛卡尔坐标转换为经纬度(三维点击坐标);
      const 目的笛卡尔坐标 = Cartesian3.fromDegrees(经纬度坐标.经度, 经纬度坐标.纬度, this.高度);
      this.移动到(目的笛卡尔坐标);
    }
  };
}

export const 阵营单位映射 = new Map([
  [阵营类型.红方, new Set<移动单位类>()],
  [阵营类型.蓝方, new Set<移动单位类>()]
]);

移动单位类.实例化事件.添加侦听回调(单位 => {
  const 阵营 = 单位.阵营;
  const 单位集合 = 阵营单位映射.get(阵营)!;
  单位集合.add(单位);
});
