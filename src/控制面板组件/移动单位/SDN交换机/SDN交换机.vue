<template>
  <div class="控制器信息 元素">
    <ControllerInfo />
  </div>
  <div class="端口列表 元素">
    <PortList />
  </div>
  <div class="流表 元素">
    <FlowTable />
  </div>
</template>

<script setup lang="ts">
import type { SDN交换机类 } from "@/网络模型/sdn";
import { provide } from "vue";
import ControllerInfo from "./控制器信息.vue";
import PortList from "./端口列表.vue";
import FlowTable from "./流表.vue";

const { SDN交换机 } = defineProps<{ SDN交换机: SDN交换机类 }>();
provide("SDN交换机", SDN交换机);
</script>

<style scoped>
.控制器信息 {
  width: 100%;
  display: inline-block;
}

.元素 {
		margin-bottom: 20px;
}
</style>
