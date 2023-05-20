import { OrderedMap } from "@js-sdsl/ordered-map";
import { Deque } from "@js-sdsl/deque";
import BiMap from "bidirect-map";

enum 状态 {
  正忙,
  停止,
  等待中
}

async function 等待(时长: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000 * 时长));
}

export class 离散事件仿真器类 {
  protected 回调映射 = new OrderedMap<number, Deque<() => Promise<void>>>();
  protected 事件回调映射 = new BiMap<() => void, () => Promise<void>>();
  protected 事件时间映射 = new Map<() => void, number>();
  protected 开始时间 = Date.now() / 1000;
  protected 状态 = 状态.停止;
  protected 事件发射器 = new EventTarget();

  protected _当前时间 = 0;
  
  get 当前时间(): number {
    if (this.状态 === 状态.正忙) {
      return this._当前时间;
    } else {
      return this.实际时间;
    }
  }
  
  get 实际时间(): number {
    if (this.状态 === 状态.停止) {
      return 0;
    } else {
      return Date.now() / 1000 - this.开始时间;
    }
  }
  
  get 时间差(): number {
    return this.实际时间 - this.当前时间;
  }
  
  async 运行(): Promise<void> {
    while (true) {
      if (this.回调映射.length > 0) {
        const [时间, 回调队列] = this.回调映射.getElementByPos(0);
        const 时间差 = 时间 - this.实际时间;
        if (时间差 > 0) {
          const 插入事件 = await this.等待插入事件超时(时间差);
          if (插入事件) {
            continue;
          }
        }
        this.状态 = 状态.正忙;
        this._当前时间 = 时间;
        while (回调队列.length > 0) {
          const 回调 = 回调队列.popFront()!;
          this.清除回调记录(回调);
          await 回调();
        }
        this.状态 = 状态.等待中;
        this.回调映射.eraseElementByPos(0);
      } else {
        await this.等待插入事件();
      }
    }
  }
  
  添加事件(时延: number, 回调: () => void): void {
    const 时间 = this.当前时间 + 时延;
    const _回调 = async () => 回调();
    let 回调队列 = this.回调映射.getElementByKey(时间);
    if (回调队列 === undefined) {
      回调队列 = new Deque<() => Promise<void>>();
    }
    回调队列.pushBack(_回调);
    this.回调映射.setElement(时间, 回调队列);
    this.事件回调映射.set(回调, _回调);
    this.事件时间映射.set(回调, 时间);
    this.事件发射器.dispatchEvent(new Event("插入事件"));
  }
  
  删除事件(回调: () => void): void {
    const 事件回调 = this.事件回调映射.get(回调);
    const 事件时间 = this.事件时间映射.get(回调);
    if (事件回调 && 事件时间) {
      const 回调队列 = this.回调映射.getElementByKey(事件时间)!;
      回调队列.eraseElementByValue(事件回调);
    }
  }
  
  设置间隔事件(间隔: number, 回调: () => void, 立即: boolean = true): void {
    this._设置间隔事件(间隔, 回调, 立即).then();
  }
  
  protected async 等待插入事件(): Promise<void> {
    await new Promise(resolve => this.事件发射器.addEventListener("插入事件", resolve, { once: true }));
  }
  
  protected async 等待插入事件超时(超时: number): Promise<boolean> {
    return await Promise.race([
      等待(超时).then(() => false),
      this.等待插入事件().then(() => true)
    ]);
  }
  
  protected 清除回调记录(回调: () => Promise<void>): void {
    const 事件 = this.事件回调映射.getKey(回调)!;
    this.事件回调映射.delete(事件);
    this.事件时间映射.delete(事件);
  }
  
  protected async _设置间隔事件(间隔: number, 回调: () => void, 立即: boolean = true): Promise<void> {
    if (立即) {
      this.添加事件(0, 回调);
    }
    while (true) {
      await new Promise<void>(resolve => this.添加事件(间隔, resolve));
      this.添加事件(0, 回调);
    }
    
  }
}

export const 离散事件仿真器 = new 离散事件仿真器类();
