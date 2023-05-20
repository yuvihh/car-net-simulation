import type { IPv4 } from "ipaddr.js";
import { 网卡基类, 网络设备类, 节点类, 链路层报文类, 频道基类 } from "./网络";
import { 传输层报文类, 网络层报文类 } from "./协议栈";
import { UndirectedGraph } from "graphology";
import dijkstra from "graphology-shortest-path/dijkstra";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { 加入编号映射 } from "@/实用程序";
import BiMap from "bidirect-map";
import { OrderedMap } from "@js-sdsl/ordered-map";
import type { Entries } from "type-fest";
import { concat, differenceWith, head, isEqual, matches, partial, pick, remove, sortedIndexBy, without } from "lodash";
import { 事件类, 注册方法调用事件, 状态事件类 } from "@/事件";
import Immutable from "immutable";

export interface 头字段类型 {
  源MAC地址?: string,
  目的MAC地址?: string,
  源IP地址?: string,
  目的IP地址?: string,
  源端口?: number,
  目的端口?: number
}

export interface 匹配字段类型 extends 头字段类型 {
  优先级: number
}

export interface 流表项类型 extends 匹配字段类型 {
  输出端口: 网卡基类
}

export const 头字段列表: (keyof 头字段类型)[] = ["源MAC地址", "目的MAC地址", "源IP地址", "目的IP地址", "源端口", "目的端口"];
export const 匹配字段列表: (keyof 匹配字段类型)[] = concat(头字段列表, "优先级");
export const 流表字段列表: (keyof 流表项类型)[] = concat(匹配字段列表, "输出端口");

export type 端口流量记录类型 = {
  发送包数: number,
  接收包数: number,
  发送字节: number,
  接收字节: number
}

export class SDN交换机类 extends 网络设备类 {
  static readonly 实例化事件 = new 事件类<[SDN交换机类]>("SDN交换机类");
  protected static readonly _网络设备类型名称 = "SDN交换机";
  readonly 流表: 流表项类型[] = [];
  readonly 端口集合 = new Set<网卡基类>();
  readonly 端口流量记录映射 = new Map<网卡基类, 端口流量记录类型>();
  readonly 添加流表项事件 = 注册方法调用事件(this, this.添加流表项);
  readonly 删除流表项事件 = 注册方法调用事件(this, this.删除流表项);
  readonly 设置控制器事件 = new 状态事件类<[SDN控制器类 | null]>("设置控制器");
  readonly 添加端口事件 = 注册方法调用事件(this, this.添加端口);
  readonly 删除端口事件 = 注册方法调用事件(this, this.删除端口);
  readonly 从端口发送事件 = 注册方法调用事件(this, this.从端口发送);
  readonly 接收事件 = 注册方法调用事件(this, this.接收);
  protected _控制器: SDN控制器类 | null = null;
  protected readonly 流表缓存 = new OrderedMap<Entries<头字段类型>, 网卡基类>();
  
  constructor(节点: 节点类) {
    super(节点);
    SDN交换机类.实例化事件.触发(this);
  }
  
  get 控制器(): SDN控制器类 | null {
    return this._控制器;
  }
  
  set 控制器(控制器: SDN控制器类 | null) {
    this.设置控制器事件.发生前.触发(控制器);
    if (this._控制器 !== 控制器) {
      if (控制器) {
        控制器.加入交换机(this);
      }
    }
    this._控制器 = 控制器;
    this.设置控制器事件.触发(控制器);
  }
  
  查询输出端口(头字段值: 头字段类型): 网卡基类 | undefined {
    return this.匹配流表(头字段值)?.输出端口;
  }
  
  添加流表项(流表项: 流表项类型): void {
    const 流表 = this.流表;
    const 匹配字段值 = pick(流表项, 匹配字段列表);
    const 匹配索引 = 流表.findIndex(_流表项 => {
      const _匹配字段值 = pick(_流表项, 匹配字段列表);
      return isEqual(匹配字段值, _匹配字段值);
    });
    if (匹配索引 >= 0) {
      流表.splice(匹配索引, 1, 流表项);
    } else {
      const 插入索引 = sortedIndexBy(this.流表, 流表项, 流表项 => -流表项.优先级);
      流表.splice(插入索引, 0, 流表项);
    }
  }
  
  删除流表项(流表项: 流表项类型): void {
    remove(this.流表, partial(isEqual, 流表项));
  }
  
  添加端口(端口: 网卡基类): void {
    this.端口集合.add(端口);
    this.端口流量记录映射.set(端口, {
      发送包数: 0,
      接收包数: 0,
      发送字节: 0,
      接收字节: 0,
    });
    const 端口接收数据包回调 = (数据包: 链路层报文类) => {
      this.接收(端口, 数据包);
      const 端口流量记录 = this.端口流量记录映射.get(端口)!;
      端口流量记录.接收包数++;
      端口流量记录.接收字节 += 数据包.length;
    };
    const 端口传输完成回调 = (数据包: 链路层报文类) => {
      const 端口流量记录 = this.端口流量记录映射.get(端口)!;
      端口流量记录.发送包数++;
      端口流量记录.发送字节 += 数据包.length;
    };
    端口.接收事件.添加侦听回调(端口接收数据包回调);
    端口.传输完成事件.添加侦听回调(端口传输完成回调);
    this.删除端口事件.添加侦听回调(_端口 => {
      if (_端口 === 端口) {
        端口.接收事件.移除侦听回调(端口接收数据包回调);
        端口.传输完成事件.移除侦听回调(端口传输完成回调);
      }
    });
  }
  
  删除端口(端口: 网卡基类): void {
    this.端口集合.delete(端口);
  }
  
  toString(): string {
    return `[${ this.constructor.name } of ${ this.节点 }]`;
  }
  
  protected 从端口发送(数据包: 链路层报文类, 端口: 网卡基类): void {
    端口.直接发送(数据包);
  }
  
  protected 接收(端口: 网卡基类, 数据包: 链路层报文类): void {
    const 头字段值 = this.解析数据包头字段(数据包);
    const 输出端口 = this.查询输出端口(头字段值);
    if (输出端口) {
      this.从端口发送(数据包, 输出端口);
    }
  }
  
  protected 匹配流表(头字段值: 头字段类型): 流表项类型 | undefined {
    return this.流表.find(流表项 => {
      const _头字段值 = pick(流表项, 头字段列表);
      return matches(_头字段值)(头字段值);
    })
  }
  
  protected 解析数据包头字段(数据包: 链路层报文类): 头字段类型 {
    const 头字段 = <头字段类型>{};
    头字段["源MAC地址"] = 数据包.源MAC地址;
    头字段["目的MAC地址"] = 数据包.目的MAC地址;
    if (数据包.载荷 instanceof 网络层报文类) {
      const 网络层报文 = 数据包.载荷;
      头字段["源IP地址"] = 网络层报文.源IP地址.toString();
      头字段["目的IP地址"] = 网络层报文.目的IP地址.toString();
      if (网络层报文.载荷 instanceof 传输层报文类) {
        const 传输层报文 = 网络层报文.载荷;
        头字段["源端口"] = 传输层报文.源端口;
        头字段["目的端口"] = 传输层报文.目的端口;
      }
    }
    return <头字段类型>头字段;
  }
}

type 已设置频道网卡类型 = 网卡基类 & { 频道: 频道基类 }

function 获取对端网卡(网卡: 已设置频道网卡类型): 网卡基类 | undefined {
  const 对端网卡列表 = without(网卡.频道.网卡列表, 网卡);
  return head(对端网卡列表);
}

export class SDN控制器类 extends 网络设备类 {
  static readonly 实例化事件 = new 事件类<[SDN控制器类]>("SDN控制器类");
  protected static readonly _网络设备类型名称 = "SDN控制器";
  protected static SDN控制器数量 = 0;
  readonly 网络拓扑 = new UndirectedGraph();
  readonly 交换机编号映射 = new BiMap<SDN交换机类, number>();
  readonly 端口映射 = new Map<网卡基类, SDN交换机类>();
  readonly 远端地址映射 = new Map<string, [SDN交换机类, 网卡基类]>();
  readonly 交换机连接端口映射 = new Map<SDN交换机类, Map<SDN交换机类, 网卡基类>>();
  readonly 应用集合 = new Set<SDN应用类>();
  readonly 添加应用事件 = 注册方法调用事件(this, this.添加应用);
  readonly 加入交换机事件 = 注册方法调用事件(this, this.加入交换机);
  readonly 添加端口事件 = 注册方法调用事件(this, this.添加端口);
  readonly 更新端口频道事件 = 注册方法调用事件(this, this.更新端口频道);
  readonly 连接变化事件 = new 状态事件类<[]>("连接变化");
  readonly 添加端口对端网卡事件 = 注册方法调用事件(this, this.添加端口对端网卡, this.连接变化事件);
  readonly 移除端口对端网卡事件 = 注册方法调用事件(this, this.移除端口对端网卡, this.连接变化事件);
  protected SDN控制器编号 = SDN控制器类.SDN控制器数量++;
  
  constructor(节点: 节点类) {
    super(节点);
    SDN控制器类.实例化事件.触发(this);
  }
  
  get 交换机迭代器(): IterableIterator<SDN交换机类> {
    return this.交换机编号映射.keys();
  }
  
  添加应用(应用: SDN应用类): void {
    this.应用集合.add(应用);
  }
  
  加入交换机(交换机: SDN交换机类): void {
    this.加入交换机到网络拓扑(交换机);
    this.交换机连接端口映射.set(交换机, new Map());
    for (const 端口 of 交换机.端口集合) {
      this.添加端口(交换机, 端口);
    }
    交换机.添加端口事件.添加侦听回调(端口 => this.添加端口(交换机, 端口));
  }
  
  toString(): string {
    return `[${ this.constructor.name }: ${ this.SDN控制器编号 } of ${ this.节点 }]`;
  }
  
  protected 添加端口(交换机: SDN交换机类, 端口: 网卡基类): void {
    this.端口映射.set(端口, 交换机);
    this.远端地址映射.delete(端口.MAC地址);
    if (端口.频道) {
      this.更新端口频道(交换机, 端口, 端口.频道);
    } else {
      端口.设置频道事件.添加侦听回调(频道 => this.更新端口频道(交换机, 端口, 频道));
    }
  }
  
  protected 更新端口频道(交换机: SDN交换机类, 端口: 网卡基类, 频道: 频道基类): void {
    const 对端网卡 = 获取对端网卡(<已设置频道网卡类型>端口);
    if (对端网卡) {
      this.添加端口对端网卡(交换机, 端口, 对端网卡);
    } else {
      const 加入网卡回调 = (对端网卡: 网卡基类) => this.添加端口对端网卡(交换机, 端口, 对端网卡);
      频道.加入网卡事件.添加侦听回调(加入网卡回调);
      端口.退出频道事件.添加侦听回调(() => {
        频道.加入网卡事件.移除侦听回调(加入网卡回调);
        端口.退出频道事件.移除当前回调();
      });
    }
    端口.退出频道事件.添加侦听回调(() => {
      端口.设置频道事件.添加侦听回调(频道 => {
        this.更新端口频道(交换机, 端口, 频道);
        端口.设置频道事件.移除当前回调();
      });
      端口.退出频道事件.移除当前回调();
    });
  }
  
  protected 添加端口对端网卡(交换机: SDN交换机类, 端口: 网卡基类, 对端网卡: 网卡基类): void {
    if (this.端口映射.has(对端网卡)) {
      const 交换机编号 = this.交换机编号映射.get(交换机)!;
      const 相邻交换机 = this.端口映射.get(对端网卡)!;
      const 相邻交换机编号 = this.交换机编号映射.get(相邻交换机)!;
      this.网络拓扑.updateEdge(交换机编号, 相邻交换机编号);
      this.交换机连接端口映射.get(交换机)!.set(相邻交换机, 端口);
      this.交换机连接端口映射.get(相邻交换机)!.set(交换机, 对端网卡);
    } else {
      this.远端地址映射.set(对端网卡.MAC地址, [交换机, 端口]);
    }
    const 频道 = 端口.频道!;
    const 退出网卡回调 = () => this.移除端口对端网卡(交换机, 端口, 对端网卡);
    频道.退出网卡事件.发生前.添加侦听回调(退出网卡回调);
    端口.退出频道事件.添加侦听回调(() => {
      频道.退出网卡事件.发生前.移除侦听回调(退出网卡回调);
      端口.退出频道事件.移除当前回调();
    });
  }
  
  protected 移除端口对端网卡(交换机: SDN交换机类, 端口: 网卡基类, 对端网卡: 网卡基类): void {
    if (this.端口映射.has(对端网卡)) {
      const 相邻交换机 = this.端口映射.get(对端网卡)!;
      const 交换机编号 = this.交换机编号映射.get(交换机)!;
      const 相邻交换机编号 = this.交换机编号映射.get(相邻交换机)!;
      if (this.网络拓扑.hasEdge(交换机编号, 相邻交换机编号)) {
        this.网络拓扑.dropEdge(交换机编号, 相邻交换机编号);
      }
      this.交换机连接端口映射.get(交换机)!.delete(相邻交换机);
      this.交换机连接端口映射.get(相邻交换机)!.delete(交换机);
    } else {
      this.远端地址映射.delete(对端网卡.MAC地址);
    }
  }
  
  protected 加入交换机到网络拓扑(交换机: SDN交换机类): void {
    const 编号 = 加入编号映射(this.交换机编号映射, 交换机);
    this.网络拓扑.addNode(编号);
  }
}

export class SDN应用类 {
  static readonly 实例化事件 = new 事件类<[SDN应用类]>("SDN应用类");
  readonly 控制器: SDN控制器类;
  
  constructor(控制器: SDN控制器类) {
    this.控制器 = 控制器;
    控制器.添加应用(this);
    SDN应用类.实例化事件.触发(this);
  }
}

export class 最短路径转发应用 extends SDN应用类 {
  protected 交换机流表映射 = new Map<SDN交换机类, 流表项类型[]>();
  
  constructor(控制器: SDN控制器类) {
    super(控制器);
    控制器.连接变化事件.添加侦听回调(() => this.更新流表());
  }
  
  更新流表(): void {
    for (const 交换机 of this.控制器.交换机迭代器) {
      const 流表项列表: 流表项类型[] = [];
      for (const [远端地址, [边缘交换机, 端口]] of this.控制器.远端地址映射) {
        let 输出端口: 网卡基类 | null = null;
        if (交换机 === 边缘交换机) {
          输出端口 = 端口;
        } else {
          const 下一跳交换机 = this.获取下一跳交换机(交换机, 边缘交换机);
          if (下一跳交换机) {
            输出端口 = this.控制器.交换机连接端口映射.get(交换机)!.get(下一跳交换机)!;
          }
        }
        if (输出端口) {
          const 流表项: 流表项类型 = { 目的MAC地址: 远端地址, 优先级: 0, 输出端口: 输出端口 };
          流表项列表.push(流表项);
        }
      }
      this.更新交换机流表(交换机, 流表项列表);
    }
  }
  
  protected 获取下一跳交换机(源交换机: SDN交换机类, 目的交换机: SDN交换机类): SDN交换机类 | undefined {
    const 交换机编号映射 = this.控制器.交换机编号映射;
    const 交换机编号 = 交换机编号映射.get(源交换机);
    const 边缘交换机编号 = 交换机编号映射.get(目的交换机);
    const 转发路径 = dijkstra.bidirectional(this.控制器.网络拓扑, 交换机编号, 边缘交换机编号);
    if (转发路径) {
      const 下一跳交换机编号 = Number(转发路径[1]);
      return 交换机编号映射.getKey(下一跳交换机编号)!;
    }
  }
  
  protected 更新交换机流表(交换机: SDN交换机类, 流表项列表: 流表项类型[]): void {
    const 旧流表项列表 = this.交换机流表映射.get(交换机)!;
    this.交换机流表映射.set(交换机, 流表项列表);
    const 移除流表项列表 = differenceWith(旧流表项列表, 流表项列表, isEqual);
    const 新增流表项列表 = differenceWith(流表项列表, 旧流表项列表, isEqual);
    移除流表项列表.forEach(流表项 => 交换机.删除流表项(流表项));
    新增流表项列表.forEach(流表项 => 交换机.添加流表项(流表项));
  }
}

export class 点到点链路剩余带宽最大意图应用类 extends SDN应用类 {
  static readonly 实例化事件 = new 事件类<[点到点链路剩余带宽最大意图应用类]>("点到点链路剩余带宽最大意图应用类");
  测量间隔: number;
  readonly 添加意图事件 = 注册方法调用事件(this, this.添加意图);
  意图集合 = Immutable.Set<Immutable.Set<IPv4>>();
  protected 链路历史流量记录 = Immutable.Map<Immutable.Set<SDN交换机类>, number>();
  protected 最后测量时间 = 离散事件仿真器.当前时间;
  protected 历史输出端口映射 = new Map<SDN交换机类, Map<string, 网卡基类>>();
  protected 网络拓扑: UndirectedGraph;
  protected 初始化 = false;
  
  constructor(控制器: SDN控制器类, 测量间隔: number) {
    super(控制器);
    this.测量间隔 = 测量间隔;
    控制器.加入交换机事件.添加侦听回调(交换机 => this.加入交换机(交换机));
    控制器.连接变化事件.添加侦听回调(() => {
      this.更新链路信息();
      this.更新流表();
    });
    this.网络拓扑 = this.控制器.网络拓扑.copy();
    for (const 交换机 of 控制器.交换机迭代器) {
      this.历史输出端口映射.set(交换机, new Map());
    }
    this.激活();
    this.初始化 = true;
    点到点链路剩余带宽最大意图应用类.实例化事件.触发(this);
  }
  
  添加意图(...意图: [IPv4, IPv4]): void {
    const _意图 = Immutable.Set(意图);
    this.意图集合 = this.意图集合.add(_意图);
    this.更新意图流表(_意图);
  }
  
  protected 加入交换机(交换机: SDN交换机类): void {
    this.历史输出端口映射.set(交换机, new Map());
  }
  
  protected 激活(): void {
    this.更新链路信息();
    this.更新流表();
    离散事件仿真器.添加事件(this.测量间隔, this.激活.bind(this));
  }
  
  protected 更新链路信息(): void {
    const 时间间隔 = 离散事件仿真器.当前时间 - this.最后测量时间;
    if (时间间隔 > 0 || !this.初始化) {
      this.网络拓扑 = this.控制器.网络拓扑.copy();
      for (const 边 of this.网络拓扑.edgeEntries()) {
        const 交换机编号 = Number(边.source);
        const 相邻交换机编号 = Number(边.target);
        const 交换机编号映射 = this.控制器.交换机编号映射;
        const 交换机 = 交换机编号映射.getKey(交换机编号)!;
        const 相邻交换机 = 交换机编号映射.getKey(相邻交换机编号)!;
        const 端口 = this.控制器.交换机连接端口映射.get(交换机)!.get(相邻交换机)!;
        const 交换机集合 = Immutable.Set.of(交换机, 相邻交换机);
        let 链路历史流量记录 = this.链路历史流量记录.get(交换机集合)!;
        if (链路历史流量记录 === undefined) {
          链路历史流量记录 = 0;
          this.链路历史流量记录 = this.链路历史流量记录.set(交换机集合, 0);
        }
        const 端口流量记录 = 交换机.端口流量记录映射.get(端口)!;
        const 累计链路流量 = 端口流量记录.发送包数 + 端口流量记录.接收包数;
        const 链路流量 = 累计链路流量 - 链路历史流量记录;
        let 链路负载 = 0;
        if (时间间隔 > 0) {
          链路负载 = 链路流量 / 时间间隔;
        }
        this.网络拓扑.setEdgeAttribute(交换机编号, 相邻交换机编号, "链路负载", 链路负载);
        this.链路历史流量记录 = this.链路历史流量记录.set(交换机集合, 累计链路流量);
      }
      this.最后测量时间 = 离散事件仿真器.当前时间;
    }
  }
  
  protected 更新流表(): void {
    for (const 意图 of this.意图集合) {
      this.更新意图流表(意图);
    }
  }
  
  protected 更新意图流表(意图: Immutable.Set<IPv4>): void {
    for (const 交换机 of this.控制器.交换机迭代器) {
      for (const [远端地址, [边缘交换机, _]] of this.控制器.远端地址映射) {
        if (交换机 !== 边缘交换机) {
          const 交换机编号映射 = this.控制器.交换机编号映射;
          const 交换机编号 = 交换机编号映射.get(交换机);
          const 边缘交换机编号 = 交换机编号映射.get(边缘交换机);
          const 转发路径 = dijkstra.bidirectional(this.网络拓扑, 交换机编号, 边缘交换机编号, "链路负载");
          if (转发路径.length > 0) {
            const 下一跳交换机编号 = Number(转发路径[1]);
            const 下一跳交换机 = 交换机编号映射.getKey(下一跳交换机编号)!;
            const 输出端口 = this.控制器.交换机连接端口映射.get(交换机)!.get(下一跳交换机)!;
            let 历史输出端口 = this.历史输出端口映射.get(交换机)!.get(远端地址);
            if (输出端口 !== 历史输出端口) {
              this.历史输出端口映射.get(交换机)!.set(远端地址, 输出端口);
              for (const [源IP地址, 目的IP地址] of [意图.toArray(), 意图.toArray().reverse()]) {
                交换机.添加流表项({
                  目的MAC地址: 远端地址,
                  源IP地址: 源IP地址.toString(),
                  目的IP地址: 目的IP地址.toString(),
                  优先级: 1,
                  输出端口: 输出端口
                });
              }
            }
          }
        }
      }
    }
  }
}
