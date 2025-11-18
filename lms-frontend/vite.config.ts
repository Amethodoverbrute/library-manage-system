import { defineConfig } from "vite";  // 📦 导入Vite配置函数
import vue from "@vitejs/plugin-vue";   // 🎯 导入Vue插件，支持Vue SFC单文件组件

// 🧪 测试配置加载
console.log("✅ Vite config loaded successfully!");

// 📚 Vite配置文件说明：
// 作用：配置开发服务器、构建选项、代理等
// 位置：项目根目录，文件名固定为 vite.config.ts
// 💡 为什么需要：统一管理开发环境设置

// https://vite.dev/config/ 官方配置文档
export default defineConfig({
  // 🧩 插件配置
  plugins: [vue()],  // Vue插件：支持.vue文件编译，启用热更新

  // 🖥️ 开发服务器配置
  server: {
    // 🌐 自动打开浏览器
    open: true,         // 启动后自动打开 http://127.0.0.1:8080
    
    // 🏠 服务器地址
    host: "127.0.0.1",  // 主机地址：
                        // "127.0.0.1" - 仅本机可访问（安全）
                        // "0.0.0.0" - 允许局域网其他设备访问
    
    // 🔌 服务器端口
    port: 8080,         // 开发服务器端口：
                        // 前端访问地址：http://127.0.0.1:8080
                        // 后端地址：http://127.0.0.1:8000
  },

  // 🔗 本地代理配置（开发环境跨域解决方案）
  proxy: {
    // 📍 代理规则：当请求路径以"/api"开头时
    "/api": {
      // 🎯 代理目标：将请求转发到
      target: "http://127.0.0.1:8000",  
                                  // 前端请求：http://127.0.0.1:8080/api/get
                                  // 实际转发：http://127.0.0.1:8000/get
      
      // 🔄 修改Origin头（重要！）
      changeOrigin: true,    // 解决跨域问题：
                             // true - 修改请求头中的Host为目标服务器
                             // false - 保持原始Host头
      
      // ✏️ 路径重写规则
      rewrite(path) {        // 函数参数path：原始请求路径
        // 🔄 移除/api前缀
        return path.replace(/^\/api/, "");  
        // 示例：
        // 输入："/api/get" → 输出："/get"
        // 输入："/api/delete" → 输出："/delete"
        // 输入："/api/test" → 输出："/test"
      },
      
      // 🔧 确保所有HTTP方法都被正确代理
      // 特别重要：DELETE、PUT等方法需要显式配置
      onProxyReq: (proxyReq, req, res) => {
        // 🔗 记录代理请求信息
        console.log(`🔗 代理转发: ${req.method} ${req.url} → http://127.0.0.1:8000${req.url.replace(/^\/api/, '')}`);
        
        // 🛡️ 确保支持所有HTTP方法
        if (req.method === 'DELETE' || req.method === 'PUT' || req.method === 'PATCH') {
          console.log(`✅ ${req.method} 方法支持确认`);
        }
      },
      
      // 🧪 测试代理配置
      configure: (proxy, options) => {
        console.log('🧪 代理配置完成:', {
          target: proxy.options.target,
          changeOrigin: proxy.options.changeOrigin,
          rewrite: proxy.options.rewrite
        });
      }
    },
  },
});

/*
💡 代理工作原理：

1️⃣ 前端发起请求：
   fetch('/api/get') → http://127.0.0.1:8080/api/get

2️⃣ Vite开发服务器拦截：
   检测到以"/api"开头的请求，启动代理

3️⃣ 代理转发请求：
   将请求转发到 http://127.0.0.1:8000/get

4️⃣ 后端处理请求：
   Express处理 /get 接口

5️⃣ 响应返回：
   后端 → Vite代理 → 前端

🌐 跨域问题解决：
- 问题：前端8080端口 → 后端8000端口（不同端口 = 跨域）
- 解决：通过Vite代理，前端认为请求发给同源服务器
- 效果：浏览器认为请求是发给 http://127.0.0.1:8080 的

⚙️ 配置细节说明：
1. proxy字段：定义代理规则
2. "/api"：匹配以/api开头的请求路径
3. target：代理目标服务器地址
4. changeOrigin：是否修改Origin请求头
5. rewrite：路径重写函数，移除/api前缀

🔧 生产环境注意：
- 开发环境：使用Vite代理（当前配置）
- 生产环境：需要配置Nginx反向代理
  示例Nginx配置：
  location /api/ {
    proxy_pass http://backend-server:8000/;
  }
*/
