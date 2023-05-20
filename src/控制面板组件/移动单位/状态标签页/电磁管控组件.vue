<template>
  <el-card header="电磁管控" shadow="hover">
    <div>
      <div>
        <el-button class="面板按钮">电磁管控面板</el-button>
      </div>
      <div>
        <el-button class="面板按钮">传感器面板</el-button>
      </div>
      <el-checkbox v-model="与上级保持一致">与上级保持一致</el-checkbox>
      <div>
        <el-row>
          <el-col span=8 class="标题">雷达</el-col>
          <el-col span=8><el-checkbox-button v-model="雷达开启" :disabled="与上级保持一致"><div class="按钮">打开</div></el-checkbox-button></el-col>
          <el-col span=8><el-checkbox-button v-model="雷达静默" :disabled="与上级保持一致"><div class="按钮">静默</div></el-checkbox-button></el-col>
        </el-row>
        <el-row>
          <el-col span=8 class="标题">声呐</el-col>
          <el-col span=8><el-checkbox-button v-model="声呐开启" :disabled="与上级保持一致"><div class="按钮">打开</div></el-checkbox-button></el-col>
          <el-col span=8><el-checkbox-button v-model="声呐静默" :disabled="与上级保持一致"><div class="按钮">静默</div></el-checkbox-button></el-col>
        </el-row>
        <el-row>
          <el-col span=8 class="标题">干扰机</el-col>
          <el-col span=8><el-checkbox-button v-model="干扰机开启" :disabled="与上级保持一致"><div class="按钮">打开</div></el-checkbox-button></el-col>
          <el-col span=8><el-checkbox-button v-model="干扰机静默" :disabled="与上级保持一致"><div class="按钮">静默</div></el-checkbox-button></el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type 移动单位类 from "@/移动单位/移动单位/移动单位";

defineProps<{单位: 移动单位类}>();

const 与上级保持一致 = ref(false);

const 雷达状态 = ref(false);
const 雷达开启 = computed({
    get() { return 雷达状态.value; },
    set(value: boolean) { 雷达状态.value = value; }
});
const 雷达静默 = computed({
    get() { return !雷达状态.value; },
    set(value: boolean) { 雷达状态.value = !value; }
});

const 声呐状态 = ref(false);
const 声呐开启 = computed({
    get() { return 声呐状态.value; },
    set(value: boolean) { 声呐状态.value = value; }
});
const 声呐静默 = computed({
    get() { return !声呐状态.value; },
    set(value: boolean) { 声呐状态.value = !value; }
});

const 干扰机状态 = ref(false);
const 干扰机开启 = computed({
    get() { return 干扰机状态.value; },
    set(value: boolean) { 干扰机状态.value = value; }
});
const 干扰机静默 = computed({
    get() { return !干扰机状态.value; },
    set(value: boolean) { 干扰机状态.value = !value; }
});
</script>

<style scoped>
.面板按钮 {
    width: 100%;
    margin-bottom: 10px;
}

.按钮 {
    width: 90px;
}

.标题 {
    width: 110px;
}
</style>
