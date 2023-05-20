<template>
  <el-card class="聊天框" body-style="padding-bottom: 0; padding-right: 0">
    <template #header>
      <el-input v-model="服务器网址" placeholder="请输入回显服务器网址">
        <template #prepend>http://</template>
        <template #append>
          <el-button :icon="ArrowRight" />
        </template>
      </el-input>
    </template>
    <div class="内容框">
      <el-scrollbar noresize always ref="滚动条引用">
        <div class="消息行" v-for="消息 of 消息列表">
          <el-card class="用户图标卡片" :class="消息.类型" body-style="padding: 0">
            <el-icon class="用户图标">
              <User v-if="消息.类型 === '发送'" class="用户内图标" />
              <Avatar v-else class="用户内图标" />
            </el-icon>
          </el-card>
          <el-card class="用户消息气泡" :class="消息.类型" body-style="padding: 8px 10px 8px 10px;" shadow="hover">
            {{ 消息.内容 }}
          </el-card>
        </div>
      </el-scrollbar>
    </div>
    <el-input class="输入框" size="large" v-model="输入框文本" placeholder="请输入消息" @keyup.enter="发送消息">
      <template #append>
        <el-button :icon="Promotion" @click="发送消息" />
      </template>
    </el-input>
  </el-card>
</template>

<script setup lang="ts">
import { ArrowRight, Avatar, Promotion, User } from "@element-plus/icons-vue";
import { computed, nextTick, onUnmounted, ref, toRaw } from "vue";
import type { ElScrollbar } from "element-plus";
import type { 回显客户端类 } from "@/网络模型/应用";
import { IPv4 } from "ipaddr.js";
import { 离散事件仿真器 } from "@/网络模型/离散事件仿真器";

const props = defineProps<{ 回显客户端: 回显客户端类 }>();
const 回显客户端 = toRaw(props.回显客户端);

const 服务器网址 = ref<string>("");
const 输入框文本 = ref<string>("");
const 消息列表 = ref<{ 内容: string, 类型: "发送" | "回复" }[]>([]);
const 滚动条引用 = ref<InstanceType<typeof ElScrollbar>>();

const 服务器IP地址 = computed(() => 服务器网址.value.split(":")[0]);
const 服务器端口 = computed(() => Number(服务器网址.value.split(":")[1]));

async function 发送消息() {
  if (输入框文本.value.length > 0) {
    const 内容 = 输入框文本.value;
    输入框文本.value = "";
    消息列表.value.push({ 内容: 内容, 类型: "发送" });
    await nextTick();
    滚动条引用.value!.setScrollTop(1e9);
    离散事件仿真器.添加事件(0, () => 回显客户端.发送请求(内容, IPv4.parse(服务器IP地址.value), 服务器端口.value));
  }
}

async function 接收回复(回复: string) {
  消息列表.value.push({ 内容: 回复, 类型: "回复" });
  await nextTick();
  滚动条引用.value!.setScrollTop(1e9);
}

回显客户端.接收数据事件.添加侦听回调(接收回复);
onUnmounted(() => 回显客户端.接收数据事件.移除侦听回调(接收回复));
</script>

<style scoped>
.聊天框 {
  height: 890px;
  margin-right: 10px;
}

.内容框 {
  height: 700px;
  overflow: auto;
  margin-bottom: 30px;
}

.消息行 {
  overflow: auto;
  clear: both;
  padding-right: 20px;
}

.用户图标卡片 {
  width: 40px;
  height: 40px;

  border-radius: 20px;
  padding: 0;
  text-align: center;
  position: relative;
}

.发送 {
  margin-left: 15px;
  float: right;
}

.回复 {
  margin-right: 15px;
  float: left;
}

.用户图标 {
  height: 60%;
  width: 60%;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.用户内图标 {
  height: 100%;
  width: 100%;
}

.用户消息气泡 {
  max-width: 400px;
  min-height: 0;
  overflow-wrap: anywhere;
  margin-bottom: 15px;
  border-radius: 15px;
}

.输入框 {
  padding-right: 20px;
}
</style>
