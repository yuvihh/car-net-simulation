import { pull } from "lodash";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";

export class 事件类<参数类型 extends any[] = any[]> {
  readonly 名称: string;
  protected readonly 侦听回调列表: ((...args: any) => void)[] = [];
  protected readonly 上级事件列表: 事件类[] = [];
  protected 当前回调: ((...args: any) => void) | null = null;
  
  constructor(名称: string, ...上级事件: 事件类[]) {
    this.名称 = 名称;
    this.上级事件列表.push(...上级事件);
  }
  
  添加侦听回调(回调: (...args: 参数类型) => void): void {
    this.侦听回调列表.push(回调);
  }
  
  移除侦听回调(回调: (...args: 参数类型) => void): void {
    pull(this.侦听回调列表, 回调);
  }
  
  移除当前回调(): void {
    if (this.当前回调) {
      this.移除侦听回调(this.当前回调);
    }
  }
  
  添加上级事件(...上级事件: 事件类[]): void {
    this.上级事件列表.push(...上级事件);
  }
  
  移除上级事件(...上级事件: 事件类[]): void {
    pull(this.上级事件列表, ...上级事件);
  }
  
  触发(...args: 参数类型): void {
    // console.log("触发", this.名称);
    this.执行回调(...args);
  }
  
  protected 执行回调(...args: 参数类型): void {
    const 侦听回调列表 = Array.from(this.侦听回调列表);
    for (const 侦听回调 of 侦听回调列表) {
      // console.log(侦听回调);
      this.当前回调 = 侦听回调;
      侦听回调(...args);
    }
    this.当前回调 = null;
    const 上级事件列表 = Array.from(this.上级事件列表);
    for (const 上级事件 of 上级事件列表) {
      上级事件.触发(...args);
    }
  }
}

export class 状态事件类<参数类型 extends any[] = any[]> extends 事件类<参数类型> {
  readonly 发生前: 事件类<参数类型>;
  
  constructor(名称: string, ...上级事件: 事件类[]) {
    super(名称, ...上级事件);
    const 上级事件发生前列表 = (<状态事件类[]>上级事件.filter(_上级事件 => _上级事件 instanceof 状态事件类))
      .map(_上级事件 => _上级事件.发生前);
    this.发生前 = new 事件类<参数类型>(`${this.名称}发生前`);
    this.发生前.添加上级事件(...上级事件发生前列表);
  }
  
  添加上级事件(...上级事件: 事件类[]): void {
    super.添加上级事件(...上级事件);
    const 上级事件发生前列表 = (<状态事件类[]>上级事件.filter(_上级事件 => _上级事件 instanceof 状态事件类))
      .map(_上级事件 => _上级事件.发生前);
    this.发生前.添加上级事件(...上级事件发生前列表);
  }
  
  移除上级事件(...上级事件: 事件类[]): void {
    super.移除上级事件(...上级事件);
    const 上级事件发生前列表 = (<状态事件类[]>上级事件.filter(_上级事件 => _上级事件 instanceof 状态事件类))
      .map(_上级事件 => _上级事件.发生前);
    this.发生前.移除上级事件(...上级事件发生前列表);
  }
}

export function 注册方法调用事件<方法类型 extends (...args: any[]) => any>(对象: any, 方法: 方法类型, ...上级事件: 事件类[]): 状态事件类<Parameters<方法类型>> {
  const 方法调用事件 = new 状态事件类<Parameters<typeof 方法>>(方法.name, ...上级事件);
  对象[方法.name] = function (this, ...args: Parameters<方法类型>): ReturnType<方法类型> {
    方法调用事件.发生前.触发(...args);
    console.log(`${离散事件仿真器.当前时间.toFixed(4)}s(+${离散事件仿真器.时间差.toFixed(4)}s) ${方法.name}(${[this, args].join(", ")})`);
    const 返回值 = 方法.call(this, ...args);
    方法调用事件.触发(...args);
    return 返回值;
  };
  return 方法调用事件;
}

interface 实例化事件类类型 {
  new (...args: any[]): any;
  实例化事件: 事件类<[any]>;
}

export function 侦听实例化完成事件(对象: any, 回调: () => void): void {
  const 构造函数 = <实例化事件类类型>对象.constructor;
  构造函数.实例化事件.添加侦听回调(_对象 => {
    if (_对象 === 对象) {
      回调();
      构造函数.实例化事件.移除当前回调();
    }
  });
}