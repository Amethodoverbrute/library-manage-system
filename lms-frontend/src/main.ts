import { createApp } from "vue";   // 🎯 导入Vue核心函数，用于创建Vue应用实例
import App from "./App.vue";        // 📱 导入根组件App.vue

/* 
🚀 Vue应用入口文件说明：
📝 作用：初始化Vue应用，配置全局插件和样式
💡 位置：src/main.ts（固定文件名，Vite默认入口）
🔧 功能：创建应用实例、注册插件、挂载到DOM
*/

// 🎨 导入Element Plus UI组件库
import ElementPlus from "element-plus";           // 📦 Element Plus主库
import "element-plus/dist/index.css";             // 🎨 Element Plus样式文件（必须引入）

/*
💡 Element Plus说明：
📝 作用：基于Vue 3的UI组件库，提供丰富的界面组件
🔧 使用：需要注册到Vue应用实例中
🎨 样式：必须引入CSS文件才能正常显示样式
⚡ 特点：按需导入、TypeScript支持、响应式设计
*/

// 🏗️ 创建Vue应用实例
const app = createApp(App);  
/*
📝 步骤详解：
1. createApp() - 创建应用实例
2. 参数App - 根组件，包含整个应用的界面
3. 返回值app - 应用实例，用于后续配置

💡 作用：
- 管理应用状态
- 注册全局组件
- 配置全局指令
- 注册插件
*/

// 🔌 注册Element Plus插件到Vue应用
app.use(ElementPlus);
/*
📝 注册过程：
1. app.use() - Vue应用实例方法，用于注册插件
2. ElementPlus - UI组件库插件
3. 内部会注册所有Element Plus组件和指令

💡 注册后效果：
- 所有组件在模板中可以直接使用
- 全局指令如v-loading自动可用
- 主题样式自动加载

🔧 可选配置：
app.use(ElementPlus, {
  size: 'default',    // 组件默认尺寸：large/medium/small
  zIndex: 2000,       // 组件层级
  locale: zhCn,       // 本地化语言
})
*/

// 🎯 将Vue应用挂载到DOM元素
app.mount("#app");
/*
📝 挂载过程：
1. app.mount() - Vue应用实例方法，挂载到DOM
2. "#app" - 选择器，匹配index.html中的<div id="app"></div>
3. 运行时将App组件渲染到指定DOM位置

💡 挂载后效果：
- Vue应用开始运行
- 响应式数据开始工作
- 用户可以与界面交互

🔧 挂载点说明：
- 必须有对应的HTML元素
- id="app"是约定俗成的命名
- 替换该元素内的所有内容

📱 整体流程：
1. 创建应用实例 → createApp(App)
2. 注册UI库 → app.use(ElementPlus)  
3. 挂载到DOM → app.mount("#app")
4. 应用开始运行 → 用户看到界面

⚠️ 注意事项：
- main.ts只执行一次
- 不能多次调用mount()
- 挂载前可以进行插件注册、全局组件注册等配置
*/
