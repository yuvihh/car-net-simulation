import { 数据包类, 节点类 } from "./网络";
import { 传输层协议类, 传输层套接字类, 传输层报文类, 网络层协议类, 网络接口类 } from "./协议栈";
import type { IPv4 } from "ipaddr.js";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import BiMap from "bidirect-map";
import { 加入编号映射 } from "@/实用程序";
import { 事件类, 注册方法调用事件, 状态事件类 } from "@/事件";

export class 终端类 extends 节点类 {
  static readonly 实例化事件 = new 事件类<[终端类]>("终端类");
  protected static 终端数量 = 0;
  readonly 网络层协议 = new 网络层协议类(this);
  readonly 传输层协议 = new 传输层协议类(this);
  readonly 应用列表: 应用类[] = [];
  readonly 添加应用事件 = 注册方法调用事件(this, this.添加应用);
  protected readonly 终端编号 = 终端类.终端数量++;
  
  constructor() {
    super();
    this.网络层协议.转交事件.添加侦听回调((载荷, 源IP地址) => {
      if (载荷 instanceof 传输层报文类) {
        this.传输层协议.接收(载荷, 源IP地址);
      }
    });
    终端类.实例化事件.触发(this);
  }
  
  添加应用(应用: 应用类): void {
    this.应用列表.push(应用);
  }
  
  toString(): string {
    return `[终端类: ${ this.终端编号 }]`;
  }
}

export class 应用层报文类 extends 数据包类 {
  头部长度 = 0;
  declare 载荷?: string;
  
  toString() {
    return `[Http| ${ this.载荷 }]`;
  }
}

export class 应用类 {
  static readonly 实例化事件 = new 事件类<[应用类]>("应用类");
  readonly 套接字: 传输层套接字类;
  readonly 发送事件 = 注册方法调用事件(this, this.发送);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  readonly 接收数据事件 = 注册方法调用事件(this, this.接收数据);
  
  constructor(终端: 终端类, 网络接口: 网络接口类) {
    this.套接字 = 终端.传输层协议.分配套接字(网络接口);
    this.套接字.转交事件.添加侦听回调((载荷, 源IP地址, 源端口) => {
      if (载荷 instanceof 应用层报文类) {
        this.接收(载荷, 源IP地址, 源端口);
      }
    });
    终端.添加应用(this);
    应用类.实例化事件.触发(this);
  }
  
  get IP地址(): IPv4 {
    return this.套接字.网络接口.IP地址;
  }
  
  get 端口(): number {
    return this.套接字.端口;
  }
  
  toString(): string {
    return `[${ this.constructor.name } at ${ this.套接字.网络接口.IP地址 }:${ this.套接字.端口 } of ${ this.套接字.网络接口.网卡.节点 }]`;
  }
  
  protected 发送(数据: string, 目的IP地址: IPv4, 目的端口: number): void {
    const 数据包 = new 应用层报文类(数据);
    this.套接字.发送(数据包, 目的IP地址, 目的端口);
  }
  
  protected 接收(数据包: 应用层报文类, 源IP地址: IPv4, 源端口: number): void {
    if (数据包.载荷) {
      const 报文内容 = 数据包.载荷;
      this.接收数据(报文内容, 源IP地址, 源端口);
    }
  }
  
  protected 接收数据(数据: string, 源IP地址: IPv4, 源端口: number): void {
  }
}

export class 回显服务器类 extends 应用类 {
  static readonly 实例化事件 = new 事件类<[回显服务器类]>("回显服务器类");
  
  constructor(终端: 终端类, 网络接口: 网络接口类) {
    super(终端, 网络接口);
    回显服务器类.实例化事件.触发(this);
  }
  
  接收数据(报文内容: string, 源IP地址: IPv4, 源端口: number): void {
    const 回显 = "r" + 报文内容;
    const 数据包 = new 应用层报文类(回显);
    this.套接字.发送(数据包, 源IP地址, 源端口);
  }
}

export class 回显客户端类 extends 应用类 {
  static readonly 实例化事件 = new 事件类<[回显客户端类]>("回显客户端类");
  readonly 发送请求事件 = 注册方法调用事件(this, this.发送请求);
  
  constructor(终端: 终端类, 网络接口: 网络接口类) {
    super(终端, 网络接口);
    回显客户端类.实例化事件.触发(this);
  }
  
  发送请求(请求内容: string, 目的IP地址: IPv4, 目的端口: number): void {
    const 数据包 = new 应用层报文类(请求内容);
    this.套接字.发送(数据包, 目的IP地址, 目的端口);
  }
  
  接收数据(数据: string, 源IP地址: IPv4, 源端口: number) {
    super.接收数据(数据, 源IP地址, 源端口);
  }
}

export type 联系人信息类型 = {
  名称: string,
  IP地址: IPv4,
  端口: number
}

export type 消息应用报文类型 = {
  发送者: string,
  消息: string
}

export class 消息应用类 extends 应用类 {
  static readonly 实例化事件 = new 事件类<[消息应用类]>("消息应用类");
  readonly 联系人名称映射 = new Map<string, 消息应用类>();
  readonly 发送消息事件 = 注册方法调用事件(this, this.发送消息);
  readonly 接收消息事件 = 注册方法调用事件(this, this.接收消息);
  
  constructor(终端: 终端类, 网络接口: 网络接口类) {
    super(终端, 网络接口);
    消息应用类.实例化事件.触发(this);
  }
  
  发送消息(消息: string, 收件人: string): void {
    const 收件消息应用 = this.联系人名称映射.get(收件人)!;
    if (收件消息应用) {
      this.发送(消息, 收件消息应用.IP地址, 收件消息应用.端口);
    }
  }
  
  接收数据(数据: string, 源IP地址: IPv4, 源端口: number) {
    const 报文内容 = <消息应用报文类型>JSON.parse(数据);
    const { 发送者, 消息 } = 报文内容;
    this.接收消息(消息, 发送者);
  }
  
  接收消息(_消息: string, _发送者: string): void {
  }
}

interface 经纬度坐标类型 {
  经度: number;
  纬度: number;
  高度: number;
}

export class 经纬度坐标类 implements 经纬度坐标类型 {
  经度: number;
  纬度: number;
  高度: number;
  
  constructor(经度: number, 纬度: number, 高度: number) {
    this.经度 = 经度;
    this.纬度 = 纬度;
    this.高度 = 高度;
  }
  
  等于(其他坐标: 经纬度坐标类): boolean {
    return this.经度 === 其他坐标.经度
      && this.纬度 === 其他坐标.纬度
      && this.高度 === 其他坐标.高度
  }
  
  toString(): string {
    const 经度 = this.经度.toPrecision(6);
    const 纬度 = this.纬度.toPrecision(6);
    const 高度 = this.高度.toPrecision(6);
    return `(${ 经度 }, ${ 纬度 }, ${ 高度 })`;
  }
}

export type 探测单位类型 = 移动单位类;
export type 探测目标类型 = 移动单位类;

export type 探测消息类型类型 = "发现目标" | "更新位置" | "丢失目标" | "重新发现";

export type 探测消息类型 = {
  发送者: number,
  类型: 探测消息类型类型,
  编号: number,
  坐标: 经纬度坐标类型
}

export type 探测状态类型 = "跟踪中" | "已丢失";

export type 探测情报类型 = {
  探测状态: 探测状态类型,
  坐标: 经纬度坐标类
};

export class 探测应用类 extends 应用类 {
  static readonly 实例化事件 = new 事件类<[探测应用类]>("探测应用类");
  static readonly 探测目标编号映射 = new BiMap<探测目标类型, number>();
  protected static readonly 探测消息应用编号映射 = new BiMap<探测应用类, number>();
  readonly 单位: 移动单位类;
  readonly 探测应用编号: number;
  readonly 已跟踪目标集合 = new Set<探测目标类型>();
  readonly 探测情报记录 = new Map<探测单位类型, Map<探测目标类型, 探测情报类型>>();
  readonly 探测组员集合 = new Set<探测应用类>();
  readonly 发现目标事件 = 注册方法调用事件(this, this.发现目标);
  readonly 更新位置事件 = 注册方法调用事件(this, this.更新位置);
  readonly 丢失目标事件 = 注册方法调用事件(this, this.丢失目标);
  readonly 重新发现事件 = 注册方法调用事件(this, this.重新发现);
  readonly 接收探测消息事件 = 注册方法调用事件(this, this.接收探测消息);
  readonly 更新探测情报事件 = new 状态事件类("更新探测情报");
  readonly 更新发现目标情报事件 = 注册方法调用事件(this, this.更新发现目标情报, this.更新探测情报事件);
  readonly 更新更新位置情报事件 = 注册方法调用事件(this, this.更新更新位置情报, this.更新探测情报事件);
  readonly 更新丢失目标情报事件 = 注册方法调用事件(this, this.更新丢失目标情报, this.更新探测情报事件);
  readonly 更新重新发现情报事件 = 注册方法调用事件(this, this.更新重新发现情报, this.更新探测情报事件);
  
  constructor(单位: 移动单位类, 网络接口: 网络接口类) {
    super(单位, 网络接口);
    this.单位 = 单位;
    this.探测情报记录.set(this.单位, new Map());
    this.探测应用编号 = 加入编号映射(探测应用类.探测消息应用编号映射, this);
    探测应用类.实例化事件.触发(this);
  }
  
  get 当前坐标(): 经纬度坐标类 {
    return this.单位.当前经纬度坐标;
  }
  
  get 本单位探测目标情报记录(): Map<探测目标类型, 探测情报类型> {
    return this.探测情报记录.get(this.单位)!;
  }
  
  添加联系人(联系人: 探测应用类): void {
    this.探测组员集合.add(联系人);
    this.探测情报记录.set(联系人.单位, new Map());
  }
  
  探测目标(目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    if (this.本单位探测目标情报记录.has(目标)) {
      if (this.已跟踪目标集合.has(目标)) {
        this.更新位置(目标, 坐标)
      } else {
        this.重新发现(目标, 坐标);
      }
    } else {
      this.发现目标(目标, 坐标);
    }
  }
  
  丢失目标(目标: 探测目标类型): void {
    this.已跟踪目标集合.delete(目标);
    const 编号 = 探测应用类.探测目标编号映射.get(目标)!;
    const 本单位探测目标情报记录 = this.探测情报记录.get(this.单位)!;
    const 探测目标情报 = 本单位探测目标情报记录.get(目标)!;
    const 上次探测坐标 = 探测目标情报.坐标;
    this.更新丢失目标情报(this.单位, 目标, 上次探测坐标);
    const 探测消息: 探测消息类型 = { 发送者: this.探测应用编号, 类型: "丢失目标", 编号: 编号, 坐标: 上次探测坐标 };
    this.广播探测消息(探测消息);
  }
  
  protected 广播探测消息(探测消息: 探测消息类型): void {
    const 数据 = JSON.stringify(探测消息);
    this.探测组员集合.forEach(探测应用 => this.发送(数据, 探测应用.IP地址, 探测应用.端口))
  }
  
  protected 接收探测消息(探测消息: 探测消息类型): void {
    const { 发送者, 类型, 编号, 坐标 } = 探测消息;
    const 经纬度坐标 = new 经纬度坐标类(坐标.经度, 坐标.纬度, 坐标.高度);
    const _发送者 = 探测应用类.探测消息应用编号映射.getKey(发送者)!;
    const 探测单位 = _发送者.单位;
    const 目标 = 探测应用类.探测目标编号映射.getKey(编号)!;
    switch (类型) {
      case "发现目标":
        this.更新发现目标情报(探测单位, 目标, 经纬度坐标);
        break;
      case "更新位置":
        this.更新更新位置情报(探测单位, 目标, 经纬度坐标);
        break;
      case "丢失目标":
        this.更新丢失目标情报(探测单位, 目标, 经纬度坐标);
        break;
      case "重新发现":
        this.更新重新发现情报(探测单位, 目标, 经纬度坐标);
        break;
    }
  }
  
  protected 发现目标(目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    this.已跟踪目标集合.add(目标);
    this.更新发现目标情报(this.单位, 目标, 坐标);
    let 编号 = 探测应用类.探测目标编号映射.get(目标);
    if (编号 === undefined) {
      编号 = 加入编号映射(探测应用类.探测目标编号映射, 目标);
    }
    const 探测消息: 探测消息类型 = { 发送者: this.探测应用编号, 类型: "发现目标", 编号: 编号, 坐标: 坐标 };
    this.广播探测消息(探测消息);
  }
  
  protected 更新发现目标情报(探测单位: 探测单位类型, 探测目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    const 探测情报: 探测情报类型 = { 探测状态: "跟踪中", 坐标: 坐标 };
    this.探测情报记录.get(探测单位)!.set(探测目标, 探测情报);
  }
  
  protected 更新位置(目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    this.更新更新位置情报(this.单位, 目标, 坐标);
    const 编号 = 探测应用类.探测目标编号映射.get(目标)!;
    const 探测消息: 探测消息类型 = { 发送者: this.探测应用编号, 类型: "更新位置", 编号: 编号, 坐标: 坐标 };
    this.广播探测消息(探测消息);
  }
  
  protected 更新更新位置情报(探测单位: 探测单位类型, 探测目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    const 探测情报 = this.探测情报记录.get(探测单位)!.get(探测目标)!;
    探测情报.坐标 = 坐标;
  }
  
  protected 重新发现(目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    this.已跟踪目标集合.add(目标);
    this.更新重新发现情报(this.单位, 目标, 坐标);
    const 编号 = 探测应用类.探测目标编号映射.get(目标)!;
    const 探测消息: 探测消息类型 = { 发送者: this.探测应用编号, 类型: "重新发现", 编号: 编号, 坐标: 坐标 };
    this.广播探测消息(探测消息);
  }
  
  protected 更新重新发现情报(探测单位: 探测单位类型, 探测目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    const 探测情报 = this.探测情报记录.get(探测单位)!.get(探测目标)!;
    探测情报.探测状态 = "跟踪中";
    探测情报.坐标 = 坐标;
  }
  
  protected 更新丢失目标情报(探测单位: 探测单位类型, 探测目标: 探测目标类型, 坐标: 经纬度坐标类): void {
    const 探测情报 = this.探测情报记录.get(探测单位)!.get(探测目标)!;
    探测情报.探测状态 = "已丢失";
    探测情报.坐标 = 坐标;
  }
  
  protected 接收数据(数据: string, 源IP地址: IPv4, 源端口: number) {
    const 探测消息 = <探测消息类型>JSON.parse(数据);
    this.接收探测消息(探测消息);
  }
}
