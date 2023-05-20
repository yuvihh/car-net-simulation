// @ts-ignore
import BiMap from "bidirect-map";

export function 获取新编号(编号映射: Map<any, number> | BiMap<any, number>): number {
  let 新编号 = 0;
  if (编号映射.size > 0) {
    const 编号迭代器 = 编号映射.values();
    const 最大编号 = Math.max(...编号迭代器);
    新编号 = 最大编号 + 1;
  }
  return 新编号;
}

export function 加入编号映射<T>(编号映射: Map<T, number> | BiMap<T, number>, 元素: T): number {
  const 编号 = 获取新编号(编号映射);
  编号映射.set(元素, 编号);
  return 编号;
}

export function 获取随机整数(最小值: number, 最大值: number): number {
  最小值 = Math.ceil(最小值);
  最大值 = Math.floor(最大值);
  return Math.floor(Math.random() * (最大值 - 最小值) + 最小值);
}
