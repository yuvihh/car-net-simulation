import { 网卡基类, 节点类, type 载荷类型, 链路层报文类, 频道基类 } from "@/网络模型/网络";
import { Deque } from "@js-sdsl/deque";
import { 网络层报文类 } from "@/网络模型/协议栈";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { random, range } from "lodash";
import { 事件类, 注册方法调用事件 } from "@/事件";

enum 状态 {
  传输中,
  就绪,
  退避中
}

export class SPMA网卡类 extends 网卡基类<SPMA频道类> {
  static readonly 实例化事件 = new 事件类<[SPMA网卡类]>("SPMA网卡类");
  readonly 加入数据包队列事件 = 注册方法调用事件(this, this.加入数据包队列);
  readonly 开始传输事件 = 注册方法调用事件(this, this.开始传输);
  readonly 传输事件 = 注册方法调用事件(this, this.传输);
  readonly 丢弃事件 = 注册方法调用事件(this, this.丢弃);
  readonly 退避事件 = 注册方法调用事件(this, this.退避);
  readonly 重置退避窗口事件 = 注册方法调用事件(this, this.重置退避窗口);
  readonly 退避完成事件 = new 事件类<[]>("退避完成");
  readonly 插入更高优先级数据包事件 = new 事件类<[]>("插入更高优先级数据包");
  protected readonly 优先级数量: number;
  protected readonly 优先级数据包队列: Deque<链路层报文类>[];
  protected readonly 优先级队列阈值: number[];
  protected readonly 数据包发送时间记录 = new Map<链路层报文类, number>();
  protected readonly 数据包优先级记录 = new Map<链路层报文类, number>();
  protected 退避窗口?: number;
  protected 状态 = 状态.就绪;
  protected 当前优先级: number = 0;
  
  constructor(节点: 节点类, 传输速率: number, 优先级数量: number, 优先级队列阈值: number[]) {
    if (优先级队列阈值.length !== 优先级数量) {
      throw Error("优先级数量不等于优先级队列阈值的长度.");
    }
    super(节点, 传输速率);
    this.优先级数量 = 优先级数量;
    this.优先级数据包队列 = range(优先级数量).map(() => new Deque<链路层报文类>());
    this.优先级队列阈值 = 优先级队列阈值;
    SPMA网卡类.实例化事件.触发(this);
  }
  
  get 频道(): SPMA频道类 | null {
    return this._频道;
  }
  
  set 频道(频道: SPMA频道类 | null) {
    this._频道 = 频道;
    this.退避窗口 = 频道?.最小退避窗口;
  }
  
  get 时隙长度(): number | undefined {
    return this._频道?.时隙长度;
  }
  
  get 退避窗口范围(): [number, number] | undefined {
    return this._频道?.退避窗口范围;
  }
  
  get 最小退避窗口(): number | undefined {
    return this._频道?.最小退避窗口;
  }
  
  get 最大退避窗口(): number | undefined {
    return this._频道?.最大退避窗口;
  }
  
  get 最大排队时长(): number | undefined {
    if (this.时隙长度 && this.最大退避窗口) {
      return this.时隙长度 * this.最大退避窗口;
    }
  }
  
  判定优先级(载荷?: 载荷类型): number {
    if (载荷 instanceof 网络层报文类) {
      const 选项 = 载荷.选项;
      const 优先级 = 选项.优先级;
      return 优先级 ? 优先级 : 0;
    } else {
      return 0;
    }
  }
  
  发送(载荷: 载荷类型, 目的MAC地址: string) {
    if (this._频道) {
      const 数据包 = new 链路层报文类(this.MAC地址, 目的MAC地址, 载荷);
      this.直接发送(<链路层报文类 & { 载荷: 载荷类型 }>数据包);
    }
  }
  
  直接发送(数据包: 链路层报文类) {
    this.加入数据包队列(数据包);
    this.记录数据包发送时间(数据包);
    this.激活传输();
  }
  
  传输(数据包: 链路层报文类): void {
    this.状态 = 状态.传输中;
    const 频道 = <SPMA频道类>this._频道;
    const 传输速率 = this.传输速率;
    频道.开始广播(this, 数据包, 传输速率);
  }
  
  传输完成(数据包: 链路层报文类) {
    this.状态 = 状态.就绪;
    this.开始传输();
  }
  
  丢弃(_数据包: 链路层报文类): void {
    this.状态 = 状态.就绪;
    this.开始传输();
  }
  
  protected 加入数据包队列(数据包: 链路层报文类): void {
    const 载荷 = 数据包.载荷;
    const 优先级 = this.判定优先级(载荷);
    if (优先级 > this.当前优先级) {
      this.插入更高优先级数据包事件.触发();
    }
    this.数据包优先级记录.set(数据包, 优先级);
    const 数据包队列 = this.优先级数据包队列[优先级];
    数据包队列.pushBack(数据包);
  }
  
  protected 记录数据包发送时间(数据包: 链路层报文类): void {
    const 当前时间 = 离散事件仿真器.当前时间;
    this.数据包发送时间记录.set(数据包, 当前时间);
  }
  
  protected 激活传输(): void {
    if (this.状态 === 状态.就绪) {
      this.开始传输();
    }
  }
  
  protected 开始传输(): void {
    for (const 优先级 of range(this.优先级数量 - 1, -1, -1)) {
      this.当前优先级 = 优先级;
      const 数据包队列 = this.优先级数据包队列[优先级];
      if (数据包队列.length > 0) {
        const 阈值 = this.优先级队列阈值[优先级];
        const 信道负载预测 = this._频道!.信道负载预测;
        const 数据包 = 数据包队列.front()!;
        const 超时 = this.判断是否超时(数据包)!;
        if (!超时) {
          if (信道负载预测 < 阈值) {
            数据包队列.eraseElementByValue(数据包);
            this.传输(数据包);
            this.清理数据包记录(数据包);
            this.重置退避窗口();
          } else {
            this.退避().then(() => this.开始传输());
          }
        } else {
          数据包队列.eraseElementByValue(数据包);
          this.丢弃(数据包);
        }
        break;
      }
    }
  }
  
  protected 清理数据包记录(数据包: 链路层报文类): void {
    this.数据包优先级记录.delete(数据包);
    this.数据包发送时间记录.delete(数据包);
  }
  
  protected 重置退避窗口(): void {
    this.退避窗口 = this.最小退避窗口;
  }
  
  protected 判断是否超时(数据包: 链路层报文类): boolean | void {
    const 发送时间 = this.数据包发送时间记录.get(数据包);
    const 最大排队时长 = this.最大排队时长!;
    if (发送时间 && 最大排队时长) {
      const 当前时间 = 离散事件仿真器.当前时间;
      const 排队时长 = 当前时间 - 发送时间;
      return 排队时长 > 最大排队时长;
    }
  }
  
  protected async 退避(): Promise<void> {
    this.状态 = 状态.退避中;
    const 退避窗口 = this.退避窗口!;
    this.退避窗口 = 退避窗口 << 1;
    const 退避长度 = random(0, 退避窗口 - 1);
    const 时隙长度 = this.时隙长度!;
    const 退避时长 = 时隙长度 * 退避长度;
    let 完成退避: () => void;
    let 取消退避: () => void;
    let 完成等待插入更高优先级数据包: () => void;
    let 取消等待插入更高优先级数据包: () => void;
    const 退避承诺 = new Promise<void>((resolve, reject) => {
      完成退避 = resolve;
      取消退避 = reject;
      离散事件仿真器.添加事件(退避时长, 完成退避);
    }).catch(() => {
      离散事件仿真器.删除事件(完成退避)
    }).then(() => {
        取消等待插入更高优先级数据包()
      });
    const 等待插入更高优先级数据包承诺 = new Promise<void>((resolve, reject) => {
      完成等待插入更高优先级数据包 = resolve;
      取消等待插入更高优先级数据包 = reject;
      this.插入更高优先级数据包事件.添加侦听回调(完成等待插入更高优先级数据包);
    }).catch(() => {
      this.插入更高优先级数据包事件.移除侦听回调(完成等待插入更高优先级数据包)
    }).then(() => {
      取消退避()
    });
    return Promise.race([退避承诺, 等待插入更高优先级数据包承诺]);
  }
}

type 数据包传输信息 = {
  传输开始时间: number,
  传输结束时间: number | null,
  传输速率: number
}

type SPMA频道类选项类型 = {
  信道数量?: number,
  时隙长度?: number,
  退避窗口范围?: [number, number],
  信道负载统计窗口数量?: number,
}

export class SPMA频道类 extends 频道基类<SPMA网卡类> {
  readonly 实例化事件 = new 事件类<[SPMA频道类]>("SPMA频道类");
  readonly 开始广播事件 = 注册方法调用事件(this, this.开始广播);
  readonly 广播事件 = 注册方法调用事件(this, this.广播);
  protected _信道数量: number = 8;
  protected _时隙长度: number = 20e-6;
  protected _退避窗口范围: [number, number] = [2, 1024];
  protected 信道负载统计窗口数量: number = 100;
  protected 数据包传输信息记录 = new Map<链路层报文类, 数据包传输信息>();
  
  constructor(选项?: SPMA频道类选项类型) {
    super();
    if (选项) {
      const {
        信道数量,
        时隙长度,
        退避窗口范围,
        信道负载统计窗口数量
      } = 选项;
      if (信道数量) {
        this._信道数量 = 信道数量;
      }
      if (时隙长度) {
        this._时隙长度 = 时隙长度;
      }
      if (退避窗口范围) {
        this._退避窗口范围 = 退避窗口范围;
      }
      if (信道负载统计窗口数量) {
        this.信道负载统计窗口数量 = 信道负载统计窗口数量;
      }
    }
    this.定时清理数据包传输信息().then();
    this.实例化事件.触发(this);
  }
  
  get 时隙长度(): number {
    return this._时隙长度;
  }
  
  get 退避窗口范围(): [number, number] {
    return this._退避窗口范围;
  }
  
  get 最小退避窗口(): number {
    return this._退避窗口范围[0];
  }
  
  get 最大退避窗口(): number {
    return this._退避窗口范围[1];
  }
  
  get 信道负载预测(): number {
    let 总传输字节数 = 0;
    const 当前时间 = 离散事件仿真器.当前时间;
    const 统计起始时间 = 当前时间 - this.信道负载统计时长;
    for (const 数据包传输信息 of this.数据包传输信息记录.values()) {
      const { 传输开始时间, 传输结束时间, 传输速率 } = 数据包传输信息;
      const 统计开始时间 = Math.max(统计起始时间, 传输开始时间);
      const 统计结束时间 = 传输结束时间 ? 传输结束时间 : 当前时间;
      let 统计时长 = 统计结束时间 - 统计开始时间;
      if (统计时长 < 0) {
        统计时长 = 0;
      }
      const 传输字节数 = 传输速率 * 统计时长;
      总传输字节数 += 传输字节数;
    }
    return 总传输字节数;
  }
  
  protected get 信道负载统计时长(): number {
    return this.信道负载统计窗口数量 * this._时隙长度;
  }
  
  开始广播(发送者: SPMA网卡类, 数据包: 链路层报文类, 传输速率: number): void {
    this.记录数据包传输信息(数据包, 传输速率);
    const 数据包长度 = 数据包.length;
    const 传输时延 = 数据包长度 / 传输速率;
    离散事件仿真器.添加事件(传输时延, () => {
      发送者.传输完成(数据包);
      this.广播(发送者, 数据包);
    });
  }
  
  广播(发送者: SPMA网卡类, 数据包: 链路层报文类) {
    super.广播(发送者, 数据包);
    const 数据包传输信息 = this.数据包传输信息记录.get(数据包)!;
    数据包传输信息.传输结束时间 = 离散事件仿真器.当前时间;
  }
  
  记录数据包传输信息(数据包: 链路层报文类, 传输速率: number): void {
    const 当前时间 = 离散事件仿真器.当前时间;
    const 数据包传输信息: 数据包传输信息 = {
      传输开始时间: 当前时间,
      传输结束时间: null,
      传输速率: 传输速率
    };
    this.数据包传输信息记录.set(数据包, 数据包传输信息);
  }
  
  清理数据包传输信息(): void {
    const 当前时间 = 离散事件仿真器.当前时间;
    const 保存信息截止时间 = 当前时间 - this.信道负载统计时长;
    for (const [数据包, { 传输结束时间 }] of this.数据包传输信息记录) {
      if (传输结束时间 !== null && 传输结束时间! < 保存信息截止时间) {
        this.数据包传输信息记录.delete(数据包);
      }
    }
  }
  
  async 定时清理数据包传输信息(): Promise<void> {
    while (true) {
      await new Promise<void>(resolve => 离散事件仿真器.添加事件(this.信道负载统计时长, () => resolve));
      this.清理数据包传输信息();
    }
  }
}
