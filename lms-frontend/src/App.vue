<script setup lang="ts">
/* 
🏠 Vue主应用组件说明：
📝 作用：作为路由容器，管理整个应用的路由视图
💡 功能：展示当前激活的路由组件
🔧 特点：使用Vue Router的RouterView组件
*/
</script>

<template>
  <!-- 🖼️ 路由视图容器：显示当前匹配路由对应的组件 -->
  <router-view />
</template>

<style>
/* 🎨 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f7fa;
}

/* 🌓 深色主题基础样式 */
.dark-theme {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.dark-theme body {
  background-color: #1a1a1a;
  color: #e0e0e0;
}
</style>