# LMS项目笔记

## 课程介绍

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251122090713723.png" alt="image-20251122090713723" style="zoom: 67%;" />



![image-20251122090818712](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251122090818712.png)







## 项目开发环境和技术栈

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116104409559.png" alt="image-20251116104409559" style="zoom: 80%;" />







## 数据库

### 数据库表设计

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116095823654.png" alt="image-20251116095823654" style="zoom:67%;" />







### 建库建表

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116100054232.png" alt="image-20251116100054232" style="zoom:67%;" />





## 前端部分

### 使用Vite构建Vue3+TS项目

![image-20251116103417643](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116103417643.png)





### 项目目录介绍

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116104438392.png" alt="image-20251116104438392"  />





### 修改Vite配置文件

![image-20251116105130830](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116105130830.png)







### Element Plus介绍

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116110206339.png" alt="image-20251116110206339" style="zoom: 80%;" />







### 安装以及导入Element Plus

<img src="C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116110325477.png" alt="image-20251116110325477" style="zoom:80%;" />









### 使用Table组件完成列表页面展示

![image-20251116113024834](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116113024834.png)







### Vue组件（父子）传值与计算属性



```vue
el-dialog v-model = "dialogVisible"

const props = defineProps({
	isShow: Boolean,
	info: Object
})

const dislogVisible = computed(() => prop.isShow)
```







### 使用Form组件完成编辑界面

![image-20251116184947478](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116184947478.png)





### Form表单验证

![image-20251116185029428](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116185029428.png)





### Vue事件监听

```vue
<script>
	watch(() => props.info, (newInfo)=>{
        if(newInfo){
            form.value={
                Id:newInfo.Id,
                BookName:newInfo.BookName,
                Author:newInfo.Author,
                TypeName:newInfo.Author,
                Remarks:newInfo.Remarks
            }
        }
    })
</script>
```











## 后端部分

### Node.js项目初始化

```powershell
pnpm init
```







### Express介绍和安装

![image-20251116191946584](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116191946584.png)





### 配置以及启动http服务

```js
const express = require("express")

const app = express()

const port = 8080

app.get('/',(req,res)=>{
    res.send("Hello World")
})

app.listen(port , ()=>{
    console.log(`Example app listening on port ${port}`)
})
```









### 安装和访问MySQL

==`node-mysql` 已长期未维护，其分支 `mysql2` 完美兼容 API 且支持新认证协议，**只需修改 1 行代码**：==

```powershell
pnpm install mysql2
```



```js
let mysql = require('mysql2')

let connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"973100",
    database:"my_db"
})

connection.connect();

connection.query("SELECT 1+1 AS solution", function(err, rows, fields){
    if(err)	throw err;
    console.log("The solution is:", rows[0].solution)
})

connection.end()
```









### 通过配置文件读取数据库信息

```js
const configs = {
    mysql:{
        host:"127.0.0.1",
        user:"root",
        password:"973100",
        database:"amob_lms"
    }
}

module.exports = configs
```









### Crud接口的实现

![image-20251116204328084](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116204328084.png)





### axios封装http请求

```js
import axios from "axios";

const get = (book_name: string) => {
  return axios.get(`http://localhost:8000/api/get?book_name=${book_name}`);
};

const add = (req: {}) => {
  return axios.post(`/api/add`, req);
};

const edit = (req: {}) => {
  return axios.post(`/api/edit`, req);
};

const del = (id: string) => {
  return axios.get(`/api/del?Id=${id}`);
};

export { get, add, edit, del };
```







### 跨域问题分析

![image-20251116223315992](C:\Users\AMOBADMIN\AppData\Roaming\Typora\typora-user-images\image-20251116223315992.png)

浏览器的严格同源策略

前端本地代理的解决方式





### 前端Vue中通过 前端代理 解决跨域问题

```js
proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
      rewrite(path) {
        return path.replace(/^\/api/, "");
      },
    },
  }
```











## 前后端联调

### 前后端联调，对接列表数据



调用方法，完成数据绑定







### 前后端联调，完善编辑页功能



调用方法，完成交互效果












---

# 📚 图书馆管理系统 - 关键注释文档



## 🏗️ 项目架构总览

### 技术栈
- **前端**: Vue 3 + TypeScript + Element Plus + Vite
- **后端**: Node.js + Express + MySQL
- **代理**: Vite开发代理服务器
- **数据库**: MySQL (连接池模式)

---



## 📁 后端 (lms-backend)

### 🔧 配置文件 (config.js)
```javascript
const configs = {
  mysql: {
    host: process.env.DB_HOST || "localhost",        // 数据库主机
    user: process.env.DB_USER || "root",             // 数据库用户名
    password: process.env.DB_PASSWORD || "973100",   // 数据库密码（环境变量）
    database: process.env.DB_NAME || "amob_lms",     // 数据库名称
  },
};
```
**💡 关键点**:
- 支持环境变量配置，便于部署
- 使用连接池模式管理数据库连接

---



### 🚀 主服务 (app.js)

#### 1. **CORS跨域配置**
```javascript
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'], // 允许的前端地址
  credentials: true,  // 允许发送Cookie和认证信息
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法
}));
```
**💡 关键点**: 解决前后端跨域问题，支持开发环境的8080端口



#### 2. **数据库连接池**

```javascript
const pool = mysql.createPool(dbConfig); // 创建连接池
pool.getConnection((err) => {
  if (err) console.error("数据库连接失败:", err);
  else console.log("数据库连接成功");
});
```
**💡 关键点**: 

- 使用连接池提高性能
- 启动时测试数据库连接



#### 3. **搜索分页接口** (`/get`)

```javascript
// 获取分页参数
const page = parseInt(req.query.page) || 1;       // 当前页码（默认1）
const pageSize = parseInt(req.query.pageSize) || 10; // 每页数量（默认10）
const offset = (page - 1) * pageSize;            // 计算偏移量

// SQL分页查询
let countSql = "SELECT COUNT(*) as total FROM books"; // 获取总数
let dataSql = "SELECT * FROM books LIMIT ? OFFSET ?"; // 获取分页数据
```
**💡 关键点**:
- 支持搜索关键词 `book_name` 模糊查询
- 先查询总数，再查询分页数据
- 返回完整分页信息（当前页、总页数、是否有上一页/下一页等）



#### 4. **CRUD操作安全实践**

```javascript
// 安全性1: 参数化查询，防SQL注入
const sql = `INSERT INTO books(book_name, author, book_type, remarks) VALUES (?, ?, ?, ?)`;
connection.query(sql, [book_name, author, book_type, remarks], callback);

// 安全性2: 释放数据库连接
connection.release(); // 重要！防止连接泄漏

// 安全性3: 错误处理
if (err) {
  console.error("操作失败:", err);
  return res.status(500).json({ error: "操作失败", details: err.message });
}
```



#### 5. **测试接口**

- `/test` - 开发环境直连测试
- `/api/test` - 代理环境测试

---



## 📁 前端 (lms-frontend)

### ⚡ 启动配置 (vite.config.ts)
```javascript
export default defineConfig({
  server: {
    host: "127.0.0.1",  // 开发服务器地址
    port: 8080,         // 开发服务器端口
  },
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8000",  // 后端地址
      changeOrigin: true,                // 修改请求头中的Host
      rewrite(path) {
        return path.replace(/^\/api/, ""); // /api/* → /*
      },
    },
  },
});
```
**💡 关键点**:

- 开发环境代理：`/api/get` → `http://127.0.0.1:8000/get`
- 生产环境需要配置Nginx等反向代理

---



### 🌐 HTTP配置 (src/http/index.ts)

#### 1. **环境适配**
```javascript
const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment ? 'http://127.0.0.1:8000' : '/api';
```
**💡 关键点**: 

- 开发环境直接访问后端地址
- 生产环境使用相对路径（通过代理）



#### 2. **请求/响应拦截器**

```javascript
// 请求拦截器：打印调试信息
api.interceptors.request.use((config) => {
  console.log('🚀 发送请求:', config.method?.toUpperCase(), config.url);
  return config;
});

// 响应拦截器：处理响应和错误
api.interceptors.response.use(
  (response) => {
    console.log('✅ 收到响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ 响应错误:', error.response?.status);
    return Promise.reject(error);
  }
);
```



#### 3. **分页搜索接口**

```javascript
const get = (book_name: string, pagination?: PaginationParams) => {
  const params = new URLSearchParams();
  
  // 搜索关键词
  if (book_name) {
    params.append('book_name', book_name);
  }
  
  // 分页参数
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString());
  
  return api.get(`/get${params.toString() ? '?' + params.toString() : ''}`);
};
```

---



### 🏠 主应用 (src/App.vue)

#### 1. **分页状态管理**
```javascript
const pagination = ref({
  currentPage: 1,      // 当前页码
  pageSize: 10,        // 每页数量
  total: 0,            // 总数量
  totalPages: 0,       // 总页数
  hasNext: false,      // 是否有下一页
  hasPrev: false,      // 是否有上一页
  from: 0,             // 当前页起始条数
  to: 0                // 当前页结束条数
});
```



#### 2. **搜索加载逻辑**

```javascript
const load = async (page?: number, pageSize?: number) => {
  // 使用分页参数调用接口
  const paginationParams = {
    page: page || pagination.value.currentPage,
    pageSize: pageSize || pagination.value.pageSize
  };
  
  const response = await get(searchVal.value, paginationParams);
  const data = response.data;
  
  if (data.success) {
    tableData.value = data.data;              // 更新表格数据
    if (data.pagination) {
      pagination.value = data.pagination;     // 更新分页信息
    }
  }
};
```



#### 3. **分页控件**

```html
<el-pagination
  v-model:current-page="pagination.currentPage"
  v-model:page-size="pagination.pageSize"
  :page-sizes="[5, 10, 20, 50]"
  :total="pagination.total"
  layout="sizes, prev, pager, next, jumper, ->, total"
  @size-change="handlePageSizeChange"
  @current-change="handlePageChange"
/>
```

---



### 📝 添加/编辑组件 (src/components/addBook.vue)

#### 1. **表单验证**
```javascript
const rules = reactive<FormRules>({
  book_name: [
    { required: true, message: "书名不能为空", trigger: "blur" },
    { min: 2, max: 256, message: "书名长度需在2-256字符", trigger: "blur" },
  ],
  // ... 其他字段验证规则
});
```



#### 2. **新增/编辑判断**

```javascript
const save = async () => {
  const valid = await ruleFormRef.value.validate();
  
  if (valid) {
    const id = Number(form.value.id);
    
    if (id > 0) {
      // 编辑操作
      const res = await edit(form.value);
      emits("success", "修改成功！");
    } else {
      // 新增操作
      const res = await add(form.value);
      emits("success", "添加成功！");
    }
  }
};
```



#### 3. **数据监听**

```javascript
watch(() => props.info, (newInfo) => {
  if (newInfo) {
    // 关键：确保id转为数字
    const id = newInfo.id ? Number(newInfo.id) : 0;
    
    form.value = {
      id: id,
      book_name: newInfo.book_name || "",
      author: newInfo.author || "",
      book_type: newInfo.book_type || newInfo.type_name || "", // 兼容性处理
      remarks: newInfo.remarks || "",
    };
  }
}, { immediate: true });
```

---





### 🚀 应用启动 (src/main.ts)

```javascript
import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

const app = createApp(App);
app.use(ElementPlus);    // 注册Element Plus
app.mount("#app");       // 挂载到DOM
```

---





## 🔄 数据流向图

```
用户操作 → 前端组件 → HTTP接口 → 后端API → 数据库查询 → 返回数据 → 更新UI
```



## 🛠️ 关键技术要点



### 1. **安全实践**

- ✅ 参数化查询防SQL注入
- ✅ CORS跨域配置
- ✅ 表单验证
- ✅ 错误处理机制



### 2. **性能优化**

- ✅ 数据库连接池
- ✅ 分页查询减少数据传输
- ✅ 请求/响应拦截器调试
- ✅ 环境适配避免重复配置



### 3. **用户体验**

- ✅ 响应式UI设计
- ✅ 实时搜索
- ✅ 分页导航
- ✅ 加载状态和错误提示



### 4. **开发体验**

- ✅ 环境变量配置
- ✅ 热更新开发
- ✅ 详细日志输出
- ✅ 类型安全（TypeScript）

---





## 🚀 部署注意事项

### 开发环境
- 前端: `http://localhost:8080` (Vite代理)
- 后端: `http://127.0.0.1:8000` (直连)



### 生产环境

- 前端: 通过Nginx提供静态文件
- 代理配置: `/api/*` → 后端地址
- 数据库: 独立的MySQL服务

---





## 📋 文件结构

```
lms-backend/
├── app.js              # 主服务器文件
├── config.js           # 数据库配置
└── package.json        # 依赖配置

lms-frontend/
├── src/
│   ├── App.vue         # 主应用组件
│   ├── main.ts         # 应用入口
│   ├── http/
│   │   └── index.ts    # HTTP接口配置
│   └── components/
│       └── addBook.vue # 添加/编辑组件
├── vite.config.ts      # Vite配置
└── index.html          # HTML模板
```

---





## 🔧 常用命令

### 开发环境启动
```bash
# 后端
cd lms-backend
npm start

# 前端
cd lms-frontend
npm run dev
```





### 生产环境构建

```bash
cd lms-frontend
npm run build
```

---





## 🎯 核心功能说明

### 1. **搜索功能**
- 支持图书名称模糊搜索
- 搜索结果自动分页
- 保留搜索条件和分页状态

### 2. **分页功能**
- 每页可选择 5/10/20/50 条
- 支持页面跳转
- 显示当前页范围信息

### 3. **CRUD操作**
- **Create**: 添加新图书
- **Read**: 查询图书列表
- **Update**: 编辑图书信息
- **Delete**: 删除图书记录

### 4. **数据验证**
- 前端表单验证
- 后端参数验证
- 安全的数据库操作

---





## 💡 开发建议

### 1. **调试技巧**
- 打开浏览器开发者工具查看Console
- 观察网络请求和响应
- 使用测试代理功能验证连接



### 2. **性能优化**

- 合理设置分页大小
- 及时释放数据库连接
- 使用连接池管理连接



### 3. **错误处理**

- 完善前后端错误提示
- 记录详细错误日志
- 优雅降级处理

---

这个系统现在具备了完整的图书管理功能，包括搜索、分页、增删改查等核心功能！🎉

---

*文档生成时间: 2025年1月*  
*项目版本: v1.0.0*

































