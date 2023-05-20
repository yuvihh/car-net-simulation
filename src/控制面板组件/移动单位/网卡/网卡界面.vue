<template>
	<el-tabs v-model="当前标签页名称">
		<el-tab-pane lable="流量嗅探" name="流量嗅探">
			hello
		</el-tab-pane>
	</el-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";

const 当前标签页名称 = ref("流量嗅探");
</script>

<style scoped>

</style>