// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected

import { Deque } from "@js-sdsl/deque";
import { 离散事件仿真器 } from "./离散事件仿真器";
import { 事件类, 注册方法调用事件 } from "@/事件";
import { pull } from "lodash";
import { convertToMac } from "@gidw/mac-address-util";

export type 载荷类型 = 数据包类 | string;

export class 数据包类 {
  载荷?: 载荷类型;
  头部长度 = 0;
  选项: Record<string, any> = {};
  
  constructor(载荷?: 载荷类型) {
    this.载荷 = 载荷;
  }
  
  get length(): number {
    return this.载荷 ? this.载荷.length + this.头部长度 : this.头部长度;
  }
}

export class 节点类 {
  static readonly 实例化事件 = new 事件类<[节点类]>("节点类");
  protected static 节点数量 = 0;
  readonly 网络设备集合 = new Set<网络设备类>();
  readonly 添加网络设备事件 = 注册方法调用事件(this, this.添加网络设备);
  readonly 删除网络设备事件 = 注册方法调用事件(this, this.删除网络设备);
  protected 节点编号 = 节点类.节点数量++;
  
  constructor() {
    节点类.实例化事件.触发(this);
  }
  
  添加网络设备(网络设备: 网络设备类): void {
    this.网络设备集合.add(网络设备);
  }
  
  删除网络设备(网络设备: 网络设备类): void {
    this.网络设备集合.delete(网络设备);
  }
  
  toString(): string {
    return `[节点: ${ this.节点编号 }]`;
  }
}

export class 链路层报文类 extends 数据包类 {
  源MAC地址: string;
  目的MAC地址: string;
  头部长度 = 14;
  
  constructor(源MAC地址: string, 目的MAC地址: string, 载荷?: 载荷类型) {
    super(载荷);
    this.源MAC地址 = 源MAC地址;
    this.目的MAC地址 = 目的MAC地址;
  }
  
  toString(): string {
    return `[Ether src=${ this.源MAC地址 } dst=${ this.目的MAC地址 }| ${ this.载荷 }]`;
  }
}

export class 网络设备类 {
  static readonly 实例化事件 = new 事件类<[网络设备类]>("网络设备类");
  static readonly 网络设备类型名称: string;
  readonly 节点: 节点类;
  
  constructor(节点: 节点类) {
    this.节点 = 节点;
    节点.添加网络设备(this);
    网络设备类.实例化事件.触发(this);
  }
}

export enum 网卡状态 {
  就绪,
  传输中
}

export abstract class 网卡基类<频道类型 extends 频道基类<网卡基类<频道类型>> = 频道基类<网卡基类<any>>> extends 网络设备类 {
  static readonly 实例化事件 = new 事件类<[网卡基类]>("网卡基类");
  protected static 网卡数量 = 0;
  readonly MAC地址 = convertToMac(++网卡基类.网卡数量);
  readonly 设置传输速率事件 = new 事件类<[number]>("设置传输速率");
  readonly 设置频道事件 = new 事件类<[频道类型]>("设置频道");
  readonly 退出频道事件 = new 事件类<[]>("退出频道");
  readonly 发送事件 = 注册方法调用事件(this, this.发送);
  readonly 直接发送事件 = 注册方法调用事件(this, this.直接发送);
  readonly 传输完成事件 = 注册方法调用事件(this, this.传输完成);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  readonly 转交事件 = 注册方法调用事件(this, this.转交);
  protected _传输速率: number = 0;
  protected _频道: 频道类型 | null = null;
  
  constructor(节点: 节点类, 传输速率: number) {
    super(节点);
    this._传输速率 = 传输速率;
    网卡基类.实例化事件.触发(this);
  }
  
  get 传输速率(): number {
    return this._传输速率;
  }
  
  set 传输速率(传输速率: number) {
    this._传输速率 = 传输速率;
    this.设置传输速率事件.触发(传输速率);
  }
  
  get 频道(): 频道类型 | null {
    return this._频道;
  }
  
  set 频道(频道: 频道类型 | null) {
    this._频道 = 频道;
    if (频道 === null) {
      this.退出频道事件.触发();
    } else {
      this.设置频道事件.触发(频道);
    }
  }
  
  发送(载荷: 载荷类型, 目的MAC地址: string): void {
    if (this._频道) {
      const 链路层报文 = new 链路层报文类(this.MAC地址, 目的MAC地址, 载荷);
      this.直接发送(链路层报文);
    }
  }
  
  abstract 直接发送(数据包: 链路层报文类): void;
  
  接收(数据包: 链路层报文类): void {
    if (数据包.目的MAC地址 === this.MAC地址 && 数据包.载荷) {
      this.转交(数据包.载荷);
    }
  }
  
  protected abstract 传输完成(数据包: 链路层报文类): void;
  
  protected 转交(_载荷: 载荷类型): void {
  }
}

export class 网卡类<频道类型 extends 频道类<网卡类<频道类型>> = 频道类<网卡类<any>>> extends 网卡基类<频道类型> {
  static readonly 实例化事件 = new 事件类<[网卡类<频道类>]>("网卡类");
  static readonly 网络设备类型名称 = "网卡";
  protected 状态 = 网卡状态.就绪;
  protected readonly 数据包队列 = new Deque<链路层报文类>();
  
  constructor(节点: 节点类, 传输速率: number) {
    super(节点, 传输速率);
    网卡类.实例化事件.触发(this);
  }
  
  直接发送(数据包: 链路层报文类) {
    this.加入到数据包队列(数据包);
  }
  
  toString(): string {
    return `[${ this.constructor.name }: ${ this.MAC地址 } of ${ this.节点 } in ${ this._频道 }]`;
  }
  
  protected 加入到数据包队列(数据包: 链路层报文类): void {
    this.数据包队列.pushBack(数据包);
    this.激活传输();
  }
  
  protected 激活传输(): void {
    if (this.状态 === 网卡状态.就绪) {
      this.开始传输();
    }
  }
  
  protected 开始传输(): void {
    if (this.数据包队列.length > 0) {
      this.状态 = 网卡状态.传输中;
      const 数据包 = this.数据包队列.front()!;
      this.传输(数据包);
    }
  }
  
  protected 传输(数据包: 链路层报文类): void {
    const 传输时延 = 数据包.length / this.传输速率;
    离散事件仿真器.添加事件(传输时延, () => this.传输完成(数据包));
    if (this._频道) {
      离散事件仿真器.添加事件(传输时延, () => this._频道!.广播(this, 数据包));
    }
  }
  
  protected 传输完成(_数据包: 链路层报文类): void {
    this.数据包队列.popFront();
    this.状态 = 网卡状态.就绪;
    this.开始传输();
  }
}

export class 频道基类<网卡类型 extends 网卡基类<频道基类<网卡类型>> = 网卡基类> {
  static readonly 实例化事件 = new 事件类<[频道基类]>("频道基类");
  static readonly 频道映射 = new Map<number, 频道基类<any>>();
  protected static 频道数量 = 0;
  readonly 频道编号 = 频道基类.频道数量++;
  网卡列表: 网卡类型[] = [];
  readonly 加入网卡事件 = 注册方法调用事件(this, this.加入网卡);
  readonly 退出网卡事件 = 注册方法调用事件(this, this.退出网卡);
  readonly 广播事件 = 注册方法调用事件(this, this.广播);
  
  constructor() {
    频道基类.实例化事件.触发(this);
  }
  
  加入网卡(网卡: 网卡类型) {
    this.网卡列表.push(网卡);
    网卡.频道 = this;
  }
  
  退出网卡(网卡: 网卡类型) {
    pull(this.网卡列表, 网卡);
    网卡.频道 = null;
  }
  
  广播(发送者: 网卡类型, 数据包: 链路层报文类): void {
    for (const 网卡 of this.网卡列表) {
      if (网卡 !== 发送者) {
        网卡.接收(数据包);
      }
    }
  }
  
  toString(): string {
    return `[${ this.constructor.name }: ${ this.频道编号 }]`;
  }
}

export class 频道类<网卡类型 extends 网卡类<频道类<网卡类型>> = 网卡类<频道类<any>>> extends 频道基类<网卡类型> {
  static readonly 实例化事件 = new 事件类<[频道类]>("频道类");
  
  constructor() {
    super();
    频道类.实例化事件.触发(this);
  }
}