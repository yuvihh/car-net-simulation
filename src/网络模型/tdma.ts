import { 网卡状态, 网卡类, 节点类, 链路层报文类, 频道类 } from "./网络";
import { 离散事件仿真器 } from "./离散事件仿真器";
import { 事件类, 注册方法调用事件 } from "@/事件";
import { Deque } from "@js-sdsl/deque";

export class TDMA网卡类 extends 网卡类<TDMA频道类> {
  static readonly 实例化事件 = new 事件类<[TDMA网卡类]>("TDMA网卡类");
  protected static _类型名称 = "TDMA";
  时隙剩余长度 = 0;
  readonly 传输中断数据包事件 = 注册方法调用事件(this, this.传输中断数据包);
  readonly 中断传输数据包事件 = 注册方法调用事件(this, this.中断传输数据包);
  readonly 设置频道事件 = new 事件类<[TDMA频道类]>("设置频道");
  protected 状态 = 网卡状态.就绪;
  protected readonly 数据包队列 = new Deque<链路层报文类>();
  protected 中断数据包: 链路层报文类 | null = null;
  protected 中断数据包剩余长度: number | null = null;
  protected _频道: TDMA频道类 | null = null;
  
  constructor(节点: 节点类, 传输速率: number) {
    super(节点, 传输速率);
    TDMA网卡类.实例化事件.触发(this);
  }
  
  激活传输(): void {
    if (this.时隙剩余长度 > 0 && this.状态 === 网卡状态.就绪) {
      if (this.中断数据包) {
        this.状态 = 网卡状态.传输中;
        this.传输中断数据包();
      } else {
        if (this.状态 === 网卡状态.就绪) {
          this.开始传输();
        }
      }
    }
  }
  
  直接发送(数据包: 链路层报文类) {
    this.加入到数据包队列(数据包);
  }
  
  protected 加入到数据包队列(数据包: 链路层报文类): void {
    this.数据包队列.pushBack(数据包);
    this.激活传输();
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
    if (传输时延 <= this.时隙剩余长度) {
      this.时隙剩余长度 -= 传输时延;
      离散事件仿真器.添加事件(传输时延, this.传输完成.bind(this, 数据包));
      const 频道 = this._频道;
      if (频道) {
        离散事件仿真器.添加事件(传输时延, 频道.广播.bind(频道, this, 数据包));
      }
    } else {
      const 剩余长度 = Math.ceil(数据包.length - Math.floor(this.时隙剩余长度 * this.传输速率));
      this.中断传输数据包(数据包, 剩余长度);
      this.时隙剩余长度 = 0;
      this.状态 = 网卡状态.就绪;
    }
  }
  
  protected 传输中断数据包(): void {
    const 传输时延 = this.中断数据包剩余长度! / this.传输速率;
    if (传输时延 <= this.时隙剩余长度) {
      this.时隙剩余长度 -= 传输时延;
      离散事件仿真器.添加事件(传输时延, this.传输完成.bind(this, this.中断数据包!));
      const 频道 = this._频道;
      if (频道) {
        离散事件仿真器.添加事件(传输时延, 频道.广播.bind(频道, this, this.中断数据包!));
      }
      this.中断数据包 = null;
      this.中断数据包剩余长度 = null;
    } else {
      const 剩余长度 = this.中断数据包剩余长度! - Math.floor(this.时隙剩余长度 * this.传输速率);
      this.中断传输数据包(this.中断数据包!, 剩余长度);
      this.时隙剩余长度 = 0;
      this.状态 = 网卡状态.就绪;
    }
  }
  
  protected 中断传输数据包(数据包: 链路层报文类, 剩余长度: number): void {
    this.中断数据包 = 数据包;
    this.中断数据包剩余长度 = 剩余长度;
  }
  
  protected 传输完成(_数据包: 链路层报文类): void {
    this.数据包队列.popFront();
    this.状态 = 网卡状态.就绪;
    this.开始传输();
  }
}

export class TDMA频道类 extends 频道类<TDMA网卡类> {
  static readonly 实例化事件 = new 事件类<[TDMA频道类]>("TDMA频道类");
  static readonly 频道映射 = new Map<number, TDMA频道类>();
  protected static 频道数量 = 0;
  readonly 频道编号 = TDMA频道类.频道数量++;
  时隙长度: number;
  protected 当前时隙网卡索引 = 0;
  protected 运行中: boolean = false;
  
  constructor(时隙长度: number) {
    super();
    this.时隙长度 = 时隙长度;
    this.运行().then();
    TDMA频道类.实例化事件.触发(this);
  }
  
  get 周期(): number {
    return this.网卡列表.length;
  }
  
  加入网卡(网卡: TDMA网卡类): void {
    super.加入网卡(网卡);
    if (!this.运行中) {
      this.运行中 = true;
      this.开始时隙();
    }
  }
  
  protected async 运行(): Promise<void> {
    while (true) {
      this.开始时隙();
      await new Promise<void>(resolve => 离散事件仿真器.添加事件(this.时隙长度, resolve));
    }
  }
  
  protected 开始时隙(): void {
    if (this.网卡列表.length > 0) {
      if (this.当前时隙网卡索引 < this.网卡列表.length - 1) {
        this.当前时隙网卡索引++;
      } else {
        this.当前时隙网卡索引 = 0;
      }
      const 当前时隙网卡 = this.网卡列表[this.当前时隙网卡索引];
      当前时隙网卡.时隙剩余长度 = this.时隙长度;
      当前时隙网卡.激活传输();
    }
  }
}