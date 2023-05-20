<template>
	<div class="容器">
		<el-table ref="流量信息表格引用" class="表格" :data="流量信息列表" :height="表格高度" highlight-current-row @current-change="选择数据包">
			<el-table-column label="时间" prop="时间" :width="120"/>
			<el-table-column label="源地址" prop="源地址" :width="80"/>
			<el-table-column label="目的地址" prop="目的地址" :width="80"/>
			<el-table-column label="字节" prop="长度" :width="60"/>
			<el-table-column label="载荷" prop="载荷" :show-overflow-tooltip="true"/>
		</el-table>
	</div>
</template>

<script setup lang="ts">
import { inject, markRaw, nextTick, type Raw, reactive, type Ref, ref } from "vue";
import { 数据包类, 网卡基类, 链路层报文类 } from "@/网络模型/网络";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";
import { 网络层报文类 } from "@/网络模型/协议栈";
import { ElTable } from "element-plus";

const { 表格高度 } = defineProps<{ 表格高度: number }>();
const 网卡 = inject<网卡基类>("网卡")!;
const 当前选择数据包 = inject<Ref<链路层报文类 | undefined>>("当前选择数据包")!;

const 流量信息表格引用 = ref<InstanceType<typeof ElTable>>();

type 流量信息类型 = {
  时间: string,
  源地址: string,
  目的地址: string,
  长度: number,
  载荷: string,
  数据包: Raw<链路层报文类>
}

const 流量信息列表 = reactive<流量信息类型[]>([]);

function 获取流量信息(数据包: 链路层报文类): 流量信息类型 {
  markRaw(数据包);
  const 时间 = 离散事件仿真器.当前时间.toFixed(6);
  let 源地址: string;
  let 目的地址: string;
  const 载荷 = 数据包.载荷;
  if (载荷 instanceof 网络层报文类) {
    const 网络层报文 = 载荷;
    源地址 = 网络层报文.源IP地址.toString();
    目的地址 = 网络层报文.目的IP地址.toString();
  } else {
    源地址 = 数据包.源MAC地址;
    目的地址 = 数据包.目的MAC地址;
  }
  const 长度 = 数据包.length;
  const _载荷 = 获取数据包载荷(数据包);
  return {
    时间: 时间,
    源地址: 源地址,
    目的地址: 目的地址,
    长度: 长度,
    载荷: _载荷,
    数据包: 数据包
  };
}

function 获取数据包载荷(数据包: 链路层报文类): string {
  let _数据包: 数据包类 = 数据包;
  while (true) {
    const 载荷 = _数据包.载荷;
    if (载荷 instanceof 数据包类) {
      _数据包 = 载荷;
    } else {
      return <string>载荷;
    }
  }
}

const 自动滚动 = true;
网卡.接收事件.添加侦听回调(数据包 => {
  const 流量信息表格行 = 获取流量信息(数据包);
  流量信息列表.push(流量信息表格行);
  if (流量信息列表.length > 500) {
    流量信息列表.shift();
  }
  if (自动滚动) {
    nextTick().then(() => 流量信息表格引用.value!.setScrollTop(1e9));
  }
});
网卡.直接发送事件.添加侦听回调(数据包 => {
  const 流量信息表格行 = 获取流量信息(数据包);
  流量信息列表.push(流量信息表格行);
  if (流量信息列表.length > 500) {
    流量信息列表.shift();
  }
  if (自动滚动) {
    nextTick().then(() => 流量信息表格引用.value!.setScrollTop(1e9));
  }
});

function 选择数据包(选择行: 流量信息类型): void {
  当前选择数据包.value = 选择行.数据包;
}
</script>

<style scoped>
.容器 {
    border: 1px solid var(--el-border-color);
}
</style>