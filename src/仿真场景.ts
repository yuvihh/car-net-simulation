import { 网卡类, 频道基类, 频道类 } from "@/网络模型/网络";
import { 网络层报文类, 网络类, 路由类 } from "@/网络模型/协议栈";
import { 探测应用类, 回显客户端类, 回显服务器类 } from "@/网络模型/应用";
import { IPv4 } from "ipaddr.js";
import 移动单位类, { 阵营类型 } from "@/移动单位/移动单位/移动单位";
import { TDMA网卡类, TDMA频道类 } from "@/网络模型/tdma";
import { SDN交换机类, SDN控制器类, 最短路径转发应用, 点到点链路剩余带宽最大意图应用类 } from "@/网络模型/sdn";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { 地图 } from "@/地图";
import * as Cesium from "cesium";
import { Cartesian3 } from "cesium";
import { SPMA网卡类, SPMA频道类 } from "@/网络模型/spma";
import { 雷达应用类, 雷达类 } from "@/移动单位/设备/雷达";
import { range } from "lodash";
import { 干扰源类 } from "@/移动单位/设备/干扰源";

export function 加载简单网络场景(): void {
  const 频道 = new 频道类();
  const 网络 = new 网络类();
  
  const 服务器节点 = new 移动单位类();
  const 服务器网卡 = new 网卡类(服务器节点, 1e6);
  频道.加入网卡(服务器网卡);
  const 服务器网络接口 = 服务器节点.网络层协议.创建网络接口(服务器网卡, 网络);
  const 回显服务器 = new 回显服务器类(服务器节点, 服务器网络接口);
  
  const 客户端节点 = new 移动单位类();
  const 客户端网卡 = new 网卡类(客户端节点, 1e6);
  频道.加入网卡(客户端网卡);
  const 客户端网络接口 = 客户端节点.网络层协议.创建网络接口(客户端网卡, 网络);
  const 回显客户端 = new 回显客户端类(客户端节点, 客户端网络接口);
  
  服务器节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 服务器网卡));
  客户端节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 客户端网卡));
  
  离散事件仿真器.添加事件(0, () => 回显客户端.发送请求("1", 服务器网络接口.IP地址, 回显服务器.套接字.端口));
}

export function 加载TDMA网络场景(): void {
  const 频道 = new TDMA频道类(0.001);
  const 网络 = new 网络类();
  
  const 服务器节点 = new 移动单位类();
  const 服务器网卡 = new TDMA网卡类(服务器节点, 1e6);
  频道.加入网卡(服务器网卡);
  const 服务器网络接口 = 服务器节点.网络层协议.创建网络接口(服务器网卡, 网络);
  const 回显服务器 = new 回显服务器类(服务器节点, 服务器网络接口);
  
  const 客户端节点 = new 移动单位类();
  const 客户端网卡 = new TDMA网卡类(客户端节点, 1e6);
  频道.加入网卡(客户端网卡);
  const 客户端网络接口 = 客户端节点.网络层协议.创建网络接口(客户端网卡, 网络);
  const 回显客户端 = new 回显客户端类(客户端节点, 客户端网络接口);
  
  服务器节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 服务器网卡));
  客户端节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 客户端网卡));
  
  回显客户端.发送请求("1", 服务器网络接口.IP地址, 回显服务器.套接字.端口);
}

export function 加载意图驱动随遇接入网络场景(): void {
  const 传输速率 = 1e6;
  const TDMA时隙 = 0.1;
  
  // 建立内网.
  const 终端节点列表: 移动单位类[] = [];
  const 网关节点列表 = new Array<移动单位类>();
  const 回显客户端列表 = [];
  const 回显服务器列表 = [];
  const 网络列表 = [];
  for (let i = 0; i < 4; i++) {
    const 频道 = new TDMA频道类(TDMA时隙);
    const 网络 = new 网络类();
    网络列表.push(网络);
    
    const 网关节点 = new 移动单位类();
    new 雷达类(网关节点);
    网关节点列表.push(网关节点);
    const 网关网卡 = new TDMA网卡类(网关节点, 传输速率);
    频道.加入网卡(网关网卡);
    const 网关网络接口 = 网关节点.网络层协议.创建网络接口(网关网卡, 网络);
    网关节点.网络层协议.设置路由(网络.网络地址, new 路由类(null, 网关网卡));
    
    const 终端节点 = new 移动单位类();
    new 雷达类(终端节点);
    终端节点列表.push(终端节点);
    const 终端网卡 = new TDMA网卡类(终端节点, 传输速率);
    频道.加入网卡(终端网卡);
    const 终端网络接口 = 终端节点.网络层协议.创建网络接口(终端网卡, 网络);
    终端节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(网关网络接口.IP地址, 终端网卡));
    const 回显客户端 = new 回显客户端类(终端节点, 终端网络接口);
    const 回显服务器 = new 回显服务器类(终端节点, 终端网络接口);
    回显客户端列表.push(回显客户端);
    回显服务器列表.push(回显服务器);
  }
  
  const 控制器节点 = new 移动单位类();
  new 雷达类(控制器节点);
  const 控制器 = new SDN控制器类(控制器节点);
  new 最短路径转发应用(控制器);
  
  // 建立网关交换机链路.
  const 网络 = new 网络类();
  const 交换机节点列表 = new Array<移动单位类>();
  const 交换机列表 = new Array<SDN交换机类>();
  const 外部网络接口列表 = [];
  for (const 网关节点 of 网关节点列表) {
    const 频道 = new TDMA频道类(TDMA时隙);
    
    const 网关网卡 = new TDMA网卡类(网关节点, 传输速率);
    频道.加入网卡(网关网卡);
    const 外部网络接口 = 网关节点.网络层协议.创建网络接口(网关网卡, 网络);
    外部网络接口列表.push(外部网络接口);
    网关节点.网络层协议.设置路由(网络.网络地址, new 路由类(null, 网关网卡));
    
    const 交换机节点 = new 移动单位类();
    new 雷达类(交换机节点);
    交换机节点列表.push(交换机节点);
    const 交换机 = new SDN交换机类(交换机节点);
    交换机.控制器 = 控制器;
    交换机列表.push(交换机);
    const 交换机网卡 = new TDMA网卡类(交换机节点, 传输速率);
    频道.加入网卡(交换机网卡);
    交换机.添加端口(交换机网卡);
  }
  
  for (let i = 0; i < 4; i++) {
    const 网关节点 = 网关节点列表[i];
    const 网络层协议 = 网关节点.网络层协议;
    const 外部网络接口 = 外部网络接口列表[i];
    const 源网卡 = 外部网络接口.网卡;
    for (let j = 0; j < 4; j++) {
      if (j !== i) {
        const 目的网络 = 网络列表[j];
        const 目的网络地址 = 目的网络.网络地址;
        const 下一跳网络接口 = 外部网络接口列表[j];
        const 下一跳IP地址 = 下一跳网络接口.IP地址;
        网络层协议.设置路由(目的网络地址, new 路由类(下一跳IP地址, 源网卡));
      }
    }
  }
  
  // 建立交换机间链路.
  for (let i = 0; i < 4; i++) {
    const 交换机节点 = 交换机节点列表[i];
    const 交换机 = 交换机列表[i];
    let 对端交换机索引;
    if (i < 3) {
      对端交换机索引 = i + 1;
    } else {
      对端交换机索引 = 0;
    }
    const 对端交换机节点 = 交换机节点列表[对端交换机索引];
    const 对端交换机 = 交换机列表[对端交换机索引];
    
    const 频道 = new TDMA频道类(TDMA时隙);
    const 交换机网卡 = new TDMA网卡类(交换机节点, 传输速率);
    频道.加入网卡(交换机网卡);
    交换机.添加端口(交换机网卡);
    const 对端交换机网卡 = new TDMA网卡类(对端交换机节点, 传输速率);
    频道.加入网卡(对端交换机网卡);
    对端交换机.添加端口(对端交换机网卡);
  }
  
  const 回显客户端 = 回显客户端列表[0];
  const 回显服务器 = 回显服务器列表[2];
  const 服务器IP地址 = 回显服务器.套接字.网络接口.IP地址;
  const 服务器端口 = 回显服务器.套接字.端口;
  (async () => {
    while (true) {
      回显客户端.发送请求("1", 服务器IP地址, 服务器端口);
      await new Promise<void>(resolve => 离散事件仿真器.添加事件(1, resolve));
    }
  })().then();
  
  const 经纬度差异列表 = [
    { 经度: -0.03, 纬度: +0.03 },
    { 经度: +0.03, 纬度: +0.03 },
    { 经度: +0.03, 纬度: -0.03 },
    { 经度: -0.03, 纬度: -0.03 },
  ];
  for (let i = 0; i < 4; i++) {
    const 经纬度差异 = 经纬度差异列表[i];
    const 经度差异 = 经纬度差异.经度;
    const 纬度差异 = 经纬度差异.纬度;
    const 终端节点 = 终端节点列表[i];
    const 网关节点 = 网关节点列表[i];
    const 交换机节点 = 交换机节点列表[i];
    const 节点列表 = [交换机节点, 网关节点, 终端节点];
    节点列表.forEach((节点, j) => {
      let { 经度, 纬度 } = 节点.当前经纬度坐标;
      经度 += 经度差异 * (j + 3);
      纬度 += 纬度差异 * (j + 3);
      const 高度 = 节点.高度;
      const 新坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
      节点.移动到(新坐标, true);
    })
  }
  
  const 网关节点 = 网关节点列表[0];
  let { 经度, 纬度 } = 网关节点.当前经纬度坐标;
  地图.camera.flyTo({
    destination: Cartesian3.fromDegrees(经度 + 0.01, 纬度 - 0.5, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-25),
      roll: 0
    }
  });
  地图.camera.completeFlight();
  
  经度 -= 0.3;
  const 干扰方坐标 = Cartesian3.fromDegrees(经度, 纬度, 0);
  const 干扰方单位 = new 移动单位类({
    位置: 干扰方坐标,
    阵营: 阵营类型.蓝方
  });
  new 干扰源类(干扰方单位, { 半径: 10000 });
}

export async function 加载意图驱动负载均衡网络场景(): Promise<void> {
  const 传输速率 = 1e6;
  const TDMA时隙 = 0.1;
  
  // 建立内网.
  const 终端节点列表: 移动单位类[] = [];
  const 网关节点列表 = new Array<移动单位类>();
  const 回显客户端列表 = [];
  const 回显服务器列表 = [];
  const 网络列表 = [];
  for (let i = 0; i < 4; i++) {
    const 频道 = new TDMA频道类(TDMA时隙);
    const 网络 = new 网络类();
    网络列表.push(网络);
    
    const 网关节点 = new 移动单位类();
    网关节点列表.push(网关节点);
    const 网关网卡 = new TDMA网卡类(网关节点, 传输速率);
    频道.加入网卡(网关网卡);
    const 网关网络接口 = 网关节点.网络层协议.创建网络接口(网关网卡, 网络);
    网关节点.网络层协议.设置路由(网络.网络地址, new 路由类(null, 网关网卡));
    
    const 终端节点 = new 移动单位类();
    终端节点列表.push(终端节点);
    const 终端网卡 = new TDMA网卡类(终端节点, 传输速率);
    频道.加入网卡(终端网卡);
    const 终端网络接口 = 终端节点.网络层协议.创建网络接口(终端网卡, 网络);
    终端节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(网关网络接口.IP地址, 终端网卡));
    const 回显客户端 = new 回显客户端类(终端节点, 终端网络接口);
    const 回显服务器 = new 回显服务器类(终端节点, 终端网络接口);
    回显客户端列表.push(回显客户端);
    回显服务器列表.push(回显服务器);
  }
  
  // 建立网关交换机链路.
  const 网络 = new 网络类();
  const 交换机节点列表 = [];
  const 交换机列表 = [];
  const 外部网络接口列表 = [];
  for (const 网关节点 of 网关节点列表) {
    const 频道 = new TDMA频道类(TDMA时隙);
    
    const 网关网卡 = new TDMA网卡类(网关节点, 传输速率);
    频道.加入网卡(网关网卡);
    const 外部网络接口 = 网关节点.网络层协议.创建网络接口(网关网卡, 网络);
    外部网络接口列表.push(外部网络接口);
    网关节点.网络层协议.设置路由(网络.网络地址, new 路由类(null, 网关网卡));
    
    const 交换机节点 = new 移动单位类();
    交换机节点列表.push(交换机节点);
    const 交换机 = new SDN交换机类(交换机节点);
    交换机列表.push(交换机);
    const 交换机网卡 = new TDMA网卡类(交换机节点, 传输速率);
    频道.加入网卡(交换机网卡);
    交换机.添加端口(交换机网卡);
  }
  
  for (let i = 0; i < 4; i++) {
    const 网关节点 = 网关节点列表[i];
    const 网络层协议 = 网关节点.网络层协议;
    const 外部网络接口 = 外部网络接口列表[i];
    const 源网卡 = 外部网络接口.网卡;
    for (let j = 0; j < 4; j++) {
      if (j !== i) {
        const 目的网络 = 网络列表[j];
        const 目的网络地址 = 目的网络.网络地址;
        const 下一跳网络接口 = 外部网络接口列表[j];
        const 下一跳IP地址 = 下一跳网络接口.IP地址;
        网络层协议.设置路由(目的网络地址, new 路由类(下一跳IP地址, 源网卡));
      }
    }
  }
  
  // 建立交换机间链路.
  for (let i = 0; i < 4; i++) {
    const 交换机节点 = 交换机节点列表[i];
    const 交换机 = 交换机列表[i];
    let 对端交换机索引;
    if (i < 3) {
      对端交换机索引 = i + 1;
    } else {
      对端交换机索引 = 0;
    }
    const 对端交换机节点 = 交换机节点列表[对端交换机索引];
    const 对端交换机 = 交换机列表[对端交换机索引];
    
    const 频道 = new TDMA频道类(TDMA时隙);
    const 交换机网卡 = new TDMA网卡类(交换机节点, 传输速率);
    频道.加入网卡(交换机网卡);
    交换机.添加端口(交换机网卡);
    const 对端交换机网卡 = new TDMA网卡类(对端交换机节点, 传输速率);
    频道.加入网卡(对端交换机网卡);
    对端交换机.添加端口(对端交换机网卡);
  }
  
  const 控制器节点 = new 移动单位类();
  const 控制器 = new SDN控制器类(控制器节点);
  new 最短路径转发应用(控制器);
  交换机列表.forEach(交换机 => 交换机.控制器 = 控制器);
  
  const 点到点链路剩余带宽最大意图应用 = new 点到点链路剩余带宽最大意图应用类(控制器, 5);
  
  const 回显客户端 = 回显客户端列表[0];
  const 回显服务器 = 回显服务器列表[2];
  const 客户端IP地址 = 回显客户端.套接字.网络接口.IP地址;
  const 服务器IP地址 = 回显服务器.套接字.网络接口.IP地址;
  const 服务器端口 = 回显服务器.套接字.端口;
  点到点链路剩余带宽最大意图应用.添加意图(客户端IP地址, 服务器IP地址);
  (async () => {
    while (true) {
      回显客户端.发送请求("1", 服务器IP地址, 服务器端口);
      await new Promise<void>(resolve => 离散事件仿真器.添加事件(1, resolve));
    }
  })().then();
  
  const 经纬度差异列表 = [
    { 经度: -0.03, 纬度: +0.03 },
    { 经度: +0.03, 纬度: +0.03 },
    { 经度: +0.03, 纬度: -0.03 },
    { 经度: -0.03, 纬度: -0.03 },
  ];
  for (let i = 0; i < 4; i++) {
    const 经纬度差异 = 经纬度差异列表[i];
    const 经度差异 = 经纬度差异.经度;
    const 纬度差异 = 经纬度差异.纬度;
    const 终端节点 = 终端节点列表[i];
    const 网关节点 = 网关节点列表[i];
    const 交换机节点 = 交换机节点列表[i];
    const 节点列表 = [交换机节点, 网关节点, 终端节点];
    节点列表.forEach((节点, j) => {
      let { 经度, 纬度 } = 节点.当前经纬度坐标;
      经度 += 经度差异 * (j + 3);
      纬度 += 纬度差异 * (j + 3);
      const 高度 = 节点.高度;
      const 新坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
      节点.移动到(新坐标, true);
    })
  }
  
  const 网关节点 = 网关节点列表[0];
  const { 经度, 纬度 } = 网关节点.当前经纬度坐标;
  地图.camera.flyTo({
    destination: Cartesian3.fromDegrees(经度 + 0.01, 纬度 - 0.5, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-25),
      roll: 0
    }
  });
  地图.camera.completeFlight();
}

export async function 测试递归(this: any): Promise<void> {
  while (true) {
    await new Promise<void>(resolve => 离散事件仿真器.添加事件(0.01, resolve));
    console.log(1);
  }
}

export function 加载SPMA网络场景(): void {
  const 频道 = new SPMA频道类({
    时隙长度: 0.01
  });
  const 网络 = new 网络类();
  
  const 服务器节点 = new 移动单位类();
  new 雷达类(服务器节点);
  const 服务器网卡 = new SPMA网卡类(服务器节点, 1e6, 2, [1000, 1000]);
  频道.加入网卡(服务器网卡);
  const 服务器网络接口 = 服务器节点.网络层协议.创建网络接口(服务器网卡, 网络);
  const 回显服务器 = new 回显服务器类(服务器节点, 服务器网络接口);
  
  const 客户端节点 = new 移动单位类();
  new 雷达类(客户端节点);
  const 客户端网卡 = new SPMA网卡类(客户端节点, 1e6, 2, [70, 70]);
  频道.加入网卡(客户端网卡);
  const 客户端网络接口 = 客户端节点.网络层协议.创建网络接口(客户端网卡, 网络);
  const 回显客户端 = new 回显客户端类(客户端节点, 客户端网络接口);
  频道.加入网卡(客户端网卡);
  服务器节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 服务器网卡));
  客户端节点.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 客户端网卡));
  
  服务器网卡.发送事件.发生前.添加侦听回调(载荷 => (<网络层报文类>载荷).选项.优先级 = 1);
  客户端网卡.发送事件.发生前.添加侦听回调(载荷 => (<网络层报文类>载荷).选项.优先级 = 1);
  
  async function 连续发送请求(): Promise<void> {
    while (true) {
      回显客户端.发送请求("1", 服务器网络接口.IP地址, 回显服务器.套接字.端口);
      await new Promise<void>(resolve => 离散事件仿真器.添加事件(1, resolve));
    }
  }
  
  连续发送请求().then();
  
  let { 经度, 纬度 } = 服务器节点.当前经纬度坐标;
  地图.camera.flyTo({
    destination: Cartesian3.fromDegrees(经度 + 0.01, 纬度 - 0.5, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-25),
      roll: 0
    }
  });
  地图.camera.completeFlight();
  
  经度 += 0.3;
  纬度 += 0.3;
  const 高度 = 服务器节点.高度;
  const 新坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
  服务器节点.移动到(新坐标, true);
  
  经度 -= 0.6;
  const 干扰方坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
  new 移动单位类({
    位置: 干扰方坐标,
    阵营: 阵营类型.蓝方
  })
}

export function 加载探测场景(): void {
  const 频道 = new 频道类();
  const 网络 = new 网络类();
  
  const 单位s: 移动单位类[] = [];
  const 探测应用s: 探测应用类[] = [];
  for (const i of range(2)) {
    const 单位 = new 移动单位类();
    单位s.push(单位);
    const 网卡 = new 网卡类(单位, 1e6);
    频道.加入网卡(网卡);
    const 网络接口 = 单位.网络层协议.创建网络接口(网卡, 网络);
    单位.网络层协议.设置路由(IPv4.parseCIDR("0.0.0.0/0"), new 路由类(null, 网卡));
    const 探测应用 = new 探测应用类(单位, 网络接口);
    探测应用s.push(探测应用);
    const 雷达 = new 雷达类(单位, { 半径: 20000 });
    new 雷达应用类(雷达, 探测应用, 0.1);
  }
  探测应用s[0].添加联系人(探测应用s[1]);
  探测应用s[1].添加联系人(探测应用s[0]);
  
  let { 经度, 纬度 } = 单位s[0].当前经纬度坐标;
  地图.camera.flyTo({
    destination: Cartesian3.fromDegrees(经度 + 0.01, 纬度 - 0.5, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-25),
      roll: 0
    }
  });
  地图.camera.completeFlight();
  
  经度 += 0.3;
  纬度 += 0.3;
  const 高度 = 单位s[0].高度;
  const 新坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
  单位s[0].移动到(新坐标, true);
  
  经度 -= 0.6;
  const 干扰方坐标 = Cartesian3.fromDegrees(经度, 纬度, 高度);
  const 干扰方单位 = new 移动单位类({
    位置: 干扰方坐标,
    阵营: 阵营类型.蓝方
  });
  new 干扰源类(干扰方单位, { 半径: 10000 });
}
