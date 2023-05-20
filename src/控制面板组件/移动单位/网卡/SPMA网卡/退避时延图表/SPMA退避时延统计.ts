import { SPMA网卡类 } from "@/网络模型/spma";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { reactive } from "vue";
import { mean } from "lodash";

export const SPMA网卡退避时延统计映射 = new Map<SPMA网卡类, number[]>();

SPMA网卡类.实例化事件.添加侦听回调((SPMA网卡: SPMA网卡类) => {
  const SPMA网卡退避时长统计: number[] = reactive([]);
  SPMA网卡退避时延统计映射.set(SPMA网卡, SPMA网卡退避时长统计);
  const 发送事件时间记录: number[] = [];
  SPMA网卡.发送事件.发生前.添加侦听回调(() => {
    const 发送时间 = 离散事件仿真器.当前时间;
    发送事件时间记录.push(发送时间);
  });
  SPMA网卡.传输事件.发生前.添加侦听回调(() => {
    const 传输时间 = 离散事件仿真器.当前时间;
    const 发送时间 = 发送事件时间记录.shift()!;
    const 退避时延 = 传输时间 - 发送时间;
    SPMA网卡退避时长统计.push(退避时延);
    console.log("退避时延", 退避时延);
    if (SPMA网卡退避时长统计.length > 10) {
      SPMA网卡退避时长统计.shift();
    }
  });
  SPMA网卡.丢弃事件.发生前.添加侦听回调(() => 发送事件时间记录.shift());
});

export function 获取SPMA网卡平均退避时延(SPMA网卡: SPMA网卡类): number {
  const SPMA网卡退避时延统计 = SPMA网卡退避时延统计映射.get(SPMA网卡)!;
  return mean(SPMA网卡退避时延统计);
}
