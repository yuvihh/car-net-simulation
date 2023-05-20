<template>
	<div id="network"></div>
</template>

<script setup lang="ts">
import { Data, DataSet, Edge, IdType, Network, Node, Options } from "vis";
import { inject, onMounted } from "vue";
import { SDN控制器类 } from "@/网络模型/sdn";
import { MAC地址映射 } from "@/状态/状态";
import 移动单位类 from "@/移动单位/移动单位/移动单位";

const SDN控制器 = inject<SDN控制器类>("SDN控制器")!;
const 网络拓扑 = SDN控制器.网络拓扑;

const 节点数据集 = new DataSet<Node>();
const 边数据集 = new DataSet<Edge>();
const 数据: Data = { nodes: 节点数据集, edges: 边数据集 };
const 选项: Options = {
  interaction: {
    hover: true,
		multiselect: true
  }
};
onMounted(() => {
  const 容器 = document.getElementById("network")!;
  new Network(容器, 数据, 选项);
});

const _节点编号映射 = new Map<any, IdType>();

function 加入节点(节点: any, 节点信息: Node): IdType {
  const 编号列表 = 节点数据集.add(节点信息);
  const 编号 = 编号列表[0];
  _节点编号映射.set(节点, 编号);
  return 编号;
}

网络拓扑.nodes().forEach(交换机编号 => {
  const _交换机编号 = Number(交换机编号);
  const 交换机 = SDN控制器.交换机编号映射.getKey(_交换机编号)!;
  const 标签 = "交换机 " + 交换机编号;
  const 节点 = <移动单位类>交换机.节点;
  const 提示信息 = 节点.单位名称;
  const 节点信息: Node = { label: 标签, title: 提示信息 };
  加入节点(交换机, 节点信息);
});
网络拓扑.forEachEdge((_边, _属性, 源节点, 目的节点) => {
  const 源交换机编号 = Number(源节点);
  const 目的交换机编号 = Number(目的节点);
  const 交换机编号映射 = SDN控制器.交换机编号映射;
  const 源交换机 = 交换机编号映射.getKey(源交换机编号);
  const 目的交换机 = 交换机编号映射.getKey(目的交换机编号);
  const 源交换机节点编号 = _节点编号映射.get(源交换机);
  const 目的交换机节点编号 = _节点编号映射.get(目的交换机);
  const 边: Edge = { from: 源交换机节点编号, to: 目的交换机节点编号 };
  边数据集.add(边);
});
SDN控制器.远端地址映射.forEach(([边缘交换机, 边缘网卡], MAC地址) => {
  const 对端网卡 = MAC地址映射.get(MAC地址)!;
  const 节点 = <移动单位类>对端网卡.节点;
  const 节点标签 = 节点.单位名称;
  const 节点信息: Node = { label: 节点标签 };
  const 节点编号 = 加入节点(节点, 节点信息);

  const 边缘交换机节点编号 = _节点编号映射.get(边缘交换机)!;
  const 边: Edge = { from: 边缘交换机节点编号, to: 节点编号 };
  边数据集.add(边);
});
</script>

<style>
#network {
    width: 560px;
    height: 848px;
}

div.vis-tooltip {
		white-space: pre;
}
</style>