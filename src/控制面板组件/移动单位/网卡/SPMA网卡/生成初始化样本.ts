import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { fill, range, zip } from "lodash";

export function 生成初始化样本(): [number, number][] {
  const 样本数量 = 100;
  const 当前时间 = 离散事件仿真器.当前时间;
  const 采样间隔 = 0.1;
  const 采样时长 = 样本数量 * 采样间隔;
  const 起始时间 = 当前时间 - 采样时长 + 1;
  const 采样时刻 = range(起始时间, 当前时间 + 采样间隔, 采样间隔);
  const 采样结果 = fill(Array(100), 0);
  const 样本列表 = <[number, number][]>zip(采样时刻, 采样结果);
  return 样本列表;
}
