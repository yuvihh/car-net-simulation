import 'element-plus/theme-chalk/dark/css-vars.css';
import "vis/dist/vis.css";
import "./main.css";

import { createApp } from 'vue';
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import 应用组件 from './应用.vue';

const 应用 = createApp(应用组件);
应用.use(ElementPlus);
应用.mount('#应用');
