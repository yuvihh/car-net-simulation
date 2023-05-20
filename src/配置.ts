import BiMap from "bidirect-map";
import { 探测应用类, 回显客户端类, 回显服务器类, 应用类 } from "@/网络模型/应用";
import { 网卡基类, 网卡类, 网络设备类, 频道基类, 频道类 } from "@/网络模型/网络";
import { TDMA网卡类, TDMA频道类 } from "@/网络模型/tdma";
import { SDN交换机类, SDN控制器类 } from "./网络模型/sdn";
import { SPMA网卡类, SPMA频道类 } from "@/网络模型/spma";
import {
  加载TDMA网络场景,
  加载意图驱动负载均衡网络场景,
  加载意图驱动随遇接入网络场景, 加载探测场景,
  加载简单网络场景
} from "@/仿真场景";

export const 网络设备类型名称映射 = new Map<abstract new (...args: any[]) => 网络设备类, string>([
  [网卡基类, "网卡"],
  [SDN交换机类, "SDN交换机"],
  [SDN控制器类, "SDN控制器"]
]);

export function 获取网络设备类型名称(网络设备: 网络设备类): string {
  for (const [网络设备类型, 名称] of 网络设备类型名称映射) {
    // noinspection SuspiciousTypeOfGuard
    if (网络设备 instanceof 网络设备类型) {
      return 名称
    }
  }
  return "网络设备";
}

export const 网卡类型映射 = new BiMap<string, new (...args: any[]) => 网卡基类>({
  "CSMA": 网卡类,
  "TDMA": TDMA网卡类,
  "SPMA": SPMA网卡类
});

export const 网卡频道类型映射 = new Map<new (...args: any[]) => 网卡基类, new (...args: any[]) => 频道基类>([
  [网卡类, 频道类],
  [TDMA网卡类, TDMA频道类],
  [SPMA网卡类, SPMA频道类]
]);

export const 频道类型名称映射 = new Map<new (...args: any[]) => 频道基类, string>([
  [频道基类, "CSMA频道"],
  [TDMA频道类, "TDMA频道"],
  [SPMA频道类, "SPMA频道"]
]);

export const 应用名称映射 = new BiMap<string, typeof 应用类>({
  "回显客户端": 回显客户端类,
  "回显服务器": 回显服务器类,
  "探测应用": 探测应用类
});

export const 场景加载函数映射 = new Map([
  ["简单网络", 加载简单网络场景],
  ["TDMA网络", 加载TDMA网络场景],
  ["意图驱动随遇接入", 加载意图驱动随遇接入网络场景],
  ["意图驱动负载均衡", 加载意图驱动负载均衡网络场景],
  ["雷达探测", 加载探测场景]
]);
