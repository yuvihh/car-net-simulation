import { 数据包类, 网卡基类, 节点类, type 载荷类型 } from "./网络";
import { IPv4 } from "ipaddr.js";
import { OrderedMap } from "@js-sdsl/ordered-map";
import { 事件类, 注册方法调用事件 } from "@/事件";

export class 网络层报文类 extends 数据包类 {
  源IP地址: IPv4;
  目的IP地址: IPv4;
  头部长度 = 20;
  
  constructor(源IP地址: IPv4, 目的IP地址: IPv4, 载荷?: 载荷类型) {
    super(载荷);
    this.源IP地址 = 源IP地址;
    this.目的IP地址 = 目的IP地址;
  }
  
  toString(): string {
    return `[IP src=${ this.源IP地址 } dst=${ this.目的IP地址 }| ${ this.载荷 }]`;
  }
}

function 整数转换为4位数组(整数: number): number[] {
  const 数据视图 = new DataView(new ArrayBuffer(4));
  数据视图.setUint32(0, 整数);
  return Array.from(new Uint8Array(数据视图.buffer));
}

export class 网络类 {
  static readonly 实例化事件 = new 事件类<[网络类]>("网络类");
  static readonly 网络映射 = new OrderedMap<[IPv4, number], 网络类>();
  protected static readonly 全局网络 = IPv4.parseCIDR("0.0.0.0/0");
  protected static 网络数量 = 0;
  protected static readonly 子网后缀 = 8;
  readonly 网络接口映射 = new OrderedMap<IPv4, 网络接口类>();
  readonly 网络地址 = 网络类.分配新网络地址();
  protected 主机数量 = 0;
  
  constructor() {
    网络类.网络映射.setElement(this.网络地址, this);
    网络类.实例化事件.触发(this);
  }
  
  protected static 分配新网络地址(): [IPv4, number] {
    const 整数地址 = new DataView(new Uint8Array(网络类.全局网络[0].toByteArray()).buffer).getUint32(0)
      + (2 << (31 - this.子网后缀)) * 网络类.网络数量;
    网络类.网络数量 += 1;
    return [new IPv4(整数转换为4位数组(整数地址)), this.子网后缀];
  }
  
  分配新IP地址(): IPv4 {
    const 整数地址 = new DataView(new Uint8Array(this.网络地址[0].toByteArray()).buffer).getUint32(0) + this.主机数量;
    this.主机数量 += 1;
    return new IPv4(整数转换为4位数组(整数地址));
  }
  
  toString(): string {
    return `[网络: ${ this.网络地址[0] }/${ this.网络地址[1] }]`;
  }
}

export class 路由类 {
  下一跳IP地址: IPv4 | null;
  源网卡: 网卡基类;
  
  constructor(下一跳IP地址: IPv4 | null, 源网卡: 网卡基类) {
    this.下一跳IP地址 = 下一跳IP地址;
    this.源网卡 = 源网卡;
  }
  
  toString(): string {
    return `{ 下一跳IP地址: ${ this.下一跳IP地址 }, 源网卡: ${ this.源网卡 } }`;
  }
}

export class 网络接口类 {
  static readonly 实例化事件 = new 事件类<[网络接口类]>("网络接口类");
  protected static readonly _网络接口映射 = new OrderedMap<IPv4, 网络接口类>();
  readonly 网卡: 网卡基类;
  readonly 网络: 网络类;
  readonly 网络层协议: 网络层协议类;
  readonly IP地址: IPv4;
  readonly 发送事件 = 注册方法调用事件(this, this.发送);
  readonly 转发事件 = 注册方法调用事件(this, this.转发);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  readonly 根据路由发送事件 = 注册方法调用事件(this, this.根据路由发送);
  readonly 找不到路由事件 = new 事件类<[IPv4]>("找不到路由");
  
  constructor(网卡: 网卡基类, 网络: 网络类, 网络层协议: 网络层协议类) {
    this.网卡 = 网卡;
    this.网络 = 网络;
    this.网络层协议 = 网络层协议;
    this.IP地址 = this.网络.分配新IP地址();
    网络.网络接口映射.setElement(this.IP地址, this);
    网络接口类._网络接口映射.setElement(this.IP地址, this);
    网络接口类.实例化事件.触发(this);
  }
  
  static get 网络接口映射(): OrderedMap<IPv4, 网络接口类> {
    return this._网络接口映射;
  }
  
  发送(载荷: 载荷类型, 目的IP地址: IPv4): void {
    const 路由 = this.网络层协议.查询路由(目的IP地址);
    if (路由) {
      const 网络层报文 = new 网络层报文类(this.IP地址, 目的IP地址, 载荷);
      this.根据路由发送(网络层报文, 路由);
    } else {
      this.找不到路由事件.触发(目的IP地址);
    }
  }
  
  接收(数据包: 网络层报文类): void {
    if (数据包.目的IP地址.toString() === this.IP地址.toString() && 数据包.载荷) {
      this.网络层协议.转交(数据包.载荷, 数据包.源IP地址);
    } else {
      this.转发(数据包);
    }
  }
  
  转发(数据包: 网络层报文类): void {
    const 路由 = this.网络层协议.查询路由(数据包.目的IP地址);
    if (路由) {
      this.根据路由发送(数据包, 路由);
    } else {
      this.找不到路由事件.触发(数据包.目的IP地址);
    }
  }
  
  protected 根据路由发送(数据包: 网络层报文类, 路由: 路由类): void {
    if (路由.下一跳IP地址 === null) {
      路由.下一跳IP地址 = 数据包.目的IP地址;
    }
    路由.源网卡.发送(数据包, 网络接口类._网络接口映射.getElementByKey(路由.下一跳IP地址)!.网卡.MAC地址);
  }
  
  toString(): string {
    return `[网络接口类: ${ this.IP地址 }/${ this.网络.网络地址[1] } of ${ this.网络层协议 }]`;
  }
}

export class 网络层协议类 {
  static readonly 实例化事件 = new 事件类<[网络层协议类]>("网络层协议类");
  protected static 网络层协议数量 = 0;
  protected readonly 网络层协议编号 = 网络层协议类.网络层协议数量++;
  readonly 节点: 节点类;
  readonly 网络接口映射 = new OrderedMap<IPv4, 网络接口类>();
  readonly 路由表 = new OrderedMap<number, OrderedMap<IPv4, 路由类>>([], (x, y) => y - x);
  readonly 添加网络接口事件 = 注册方法调用事件(this, this.添加网络接口);
  readonly 删除网络接口事件 = 注册方法调用事件(this, this.删除网络接口);
  readonly 创建网络接口事件 = 注册方法调用事件(this, this.创建网络接口);
  readonly 设置路由事件 = 注册方法调用事件(this, this.设置路由);
  readonly 删除路由事件 = 注册方法调用事件(this, this.删除路由);
  readonly 转交事件 = 注册方法调用事件(this, this.转交);
  
  constructor(节点: 节点类) {
    this.节点 = 节点;
    网络层协议类.实例化事件.触发(this);
  }
  
  get 网络接口列表(): 网络接口类[] {
    return Array.from(this.网络接口映射, ([_, 网络接口]) => 网络接口);
  }
  
  添加网络接口(IP地址: IPv4, 网络接口: 网络接口类) {
    this.网络接口映射.setElement(IP地址, 网络接口);
  }
  
  删除网络接口(网络接口: 网络接口类): void {
    this.网络接口映射.eraseElementByKey(网络接口.IP地址);
  }
  
  创建网络接口(网卡: 网卡基类, 网络: 网络类): 网络接口类 {
    const 网络接口 = new 网络接口类(网卡, 网络, this);
    this.添加网络接口(网络接口.IP地址, 网络接口);
    网卡.转交事件.添加侦听回调(载荷 => {
      if (载荷 instanceof 网络层报文类) {
        网络接口.接收(载荷);
      }
    });
    return 网络接口;
  }
  
  查询路由(目的IP地址: IPv4): 路由类 | void {
    for (const [后缀长度, _路由表] of this.路由表) {
      for (const [IP地址, 路由] of _路由表) {
        if (目的IP地址.match([IP地址, 后缀长度])) {
          return 路由;
        }
      }
    }
  }
  
  设置路由(目的网络地址: [IPv4, number], 路由: 路由类): void {
    const [IP地址, 后缀长度] = 目的网络地址;
    let _路由表 = this.路由表.getElementByKey(后缀长度);
    if (!_路由表) {
      _路由表 = new OrderedMap<IPv4, 路由类>();
      this.路由表.setElement(后缀长度, _路由表);
    }
    _路由表.setElement(IP地址, 路由);
  }
  
  删除路由(目的网络地址: [IPv4, number]): void {
    const [IP地址, 后缀长度] = 目的网络地址;
    const _路由表 = this.路由表.getElementByKey(后缀长度);
    if (_路由表) {
      if (_路由表.eraseElementByKey(IP地址)) {
        return;
      }
    }
    throw Error("没有该路由.");
  }
  
  转交(_载荷: 载荷类型, _源IP地址: IPv4): void {
  }
  
  toString(): string {
    return `[网络层协议类 of ${ this.节点 }]`;
  }
}

export class 传输层报文类 extends 数据包类 {
  源端口: number;
  目的端口: number;
  头部长度 = 8;
  
  constructor(源端口: number, 目的端口: number, 载荷: 载荷类型) {
    super(载荷);
    this.源端口 = 源端口;
    this.目的端口 = 目的端口;
  }
  
  toString(): string {
    return `[UDP src=${ this.源端口 } dst=${ this.目的端口 }| ${ this.载荷 }]`;
  }
}

export class 传输层套接字类 {
  static readonly 实例化事件 = new 事件类<[传输层套接字类]>("传输层套接字类");
  readonly 传输层协议: 传输层协议类;
  readonly 网络接口: 网络接口类;
  readonly 端口: number;
  readonly 发送事件 = 注册方法调用事件(this, this.发送);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  readonly 转交事件 = 注册方法调用事件(this, this.转交);
  
  constructor(网络接口: 网络接口类, 端口: number, 传输层协议: 传输层协议类) {
    this.网络接口 = 网络接口;
    this.端口 = 端口;
    this.传输层协议 = 传输层协议;
    传输层套接字类.实例化事件.触发(this);
  }
  
  发送(载荷: 载荷类型, 目的IP地址: IPv4, 目的端口: number): void {
    const 数据包 = new 传输层报文类(this.端口, 目的端口, 载荷);
    this.网络接口.发送(数据包, 目的IP地址);
  }
  
  接收(数据包: 传输层报文类, 源IP地址: IPv4): void {
    if (数据包.载荷) {
      this.转交(数据包.载荷, 源IP地址, 数据包.源端口);
    }
  }
  
  转交(_载荷: 载荷类型, _源IP地址: IPv4, _源端口: number) {
  }
  
  toString(): string {
    return `[传输层套接字类 at ${ this.网络接口.IP地址 }:2 of ${ this.传输层协议 }]`;
  }
}

export class 传输层协议类 {
  static readonly 实例化事件 = new 事件类<[传输层协议类]>("传输层协议类");
  protected static 传输层协议数量 = 0;
  protected readonly 传输层协议编号 = 传输层协议类.传输层协议数量++;
  readonly 套接字映射 = new Map<number, 传输层套接字类>();
  readonly 节点: 节点类;
  readonly 分配套接字事件 = 注册方法调用事件(this, this.分配套接字);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  readonly 找不到端口事件 = new 事件类("找不到端口");
  
  constructor(节点: 节点类) {
    this.节点 = 节点;
    传输层协议类.实例化事件.触发(this);
  }
  
  分配套接字(网络接口: 网络接口类): 传输层套接字类 {
    const 端口 = this.套接字映射.size;
    const 套接字 = new 传输层套接字类(网络接口, 端口, this);
    this.套接字映射.set(端口, 套接字);
    return 套接字;
  }
  
  接收(数据包: 传输层报文类, 源IP地址: IPv4): void {
    const 套接字 = this.套接字映射.get(数据包.目的端口);
    if (套接字) {
      套接字.接收(数据包, 源IP地址);
    } else {
      this.找不到端口事件.触发();
    }
  }
  
  toString(): string {
    return `[传输层套接字类 of ${ this.节点 }]`;
  }
}
