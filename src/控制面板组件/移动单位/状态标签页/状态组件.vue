<template>
	<el-card header="状态" shadow="hover">
		<el-card body-style="padding: 5px;">
			<img class="单位图片" :src="单位.图片" alt="">
		</el-card>
		<el-descriptions border :column="2" size="default" style="margin-bottom: 10px; margin-top: 10px">
			<el-descriptions-item label="种类">
				<el-link type="primary">{{ 单位.名称 }}</el-link>
			</el-descriptions-item>
			<el-descriptions-item span=2>
				<template #label>
					<el-icon>
						<Flag/>
					</el-icon>
					阵营
				</template>
				红方
			</el-descriptions-item>
			<el-descriptions-item>
				<template #label>
					<el-icon>
						<Position/>
					</el-icon>
					方向
				</template>
				90 度
			</el-descriptions-item>
			<el-descriptions-item>
				<template #label>
					<el-icon>
						<Promotion/>
					</el-icon>
					速度
				</template>
				90 公里/时
			</el-descriptions-item>
			<el-descriptions-item>
				<template #label>
					<el-icon>
						<Location/>
					</el-icon>
					经度
				</template>
				170 度
			</el-descriptions-item>
			<el-descriptions-item>
				<template #label>
					<el-icon>
						<Location/>
					</el-icon>
					纬度
				</template>
				60 度
			</el-descriptions-item>
			<el-descriptions-item span=2>
				<template #label>
					<el-icon>
						<Tools/>
					</el-icon>
					损伤
				</template>
				<div class="损伤">
					<el-progress class="进度条" :percentage="10" color="green"/>
					<el-button style="float: left">损管</el-button>
				</div>
			</el-descriptions-item>
			<el-descriptions-item label="系统" span=2>
				<el-progress :percentage="100"/>
			</el-descriptions-item>
			<el-descriptions-item label="失火" span=2>
				<el-progress :percentage=10 color="red"/>
			</el-descriptions-item>
			<el-descriptions-item label="编队" span=1>无</el-descriptions-item>
			<el-descriptions-item label="状态" span=1>执行任务</el-descriptions-item>
		</el-descriptions>
	</el-card>
</template>

<script setup lang="ts">
import type 移动单位类 from "@/移动单位/移动单位/移动单位";
import { Flag, Location, Position, Promotion, StarFilled, Tools } from "@element-plus/icons-vue";

defineProps<{ 单位: 移动单位类 }>();
</script>

<style scoped>
.单位图片 {
    height: 100%;
    width: 100%;
}

.损伤 {
    display: flex;
    align-content: center;
}

.进度条 {
    width: 100%;
    position: center;
    float: left;
}</style>
